<?php

namespace RspBridge\Controller;

use DateTime;
use Exception;
use RuntimeException;
use Zend\Mvc\Controller\AbstractActionController;

/**
 * JSON-Schnittstelle: freie Zeiten mit Preisen, buchen, stornieren, Status.
 *
 * Alle Prüfungen laufen über die ep-3-eigenen Dienste (SquareValidator,
 * SquarePricingManager, BookingService). Dieses Modul rechnet selbst keine
 * Verfügbarkeit und keine Preise.
 */
class BridgeController extends AbstractActionController
{

    const TOKEN_META = 'bridge.token';

    /* ---------------------------------------------------------------- */
    /* GET /bridge/slots?date=YYYY-MM-DD                                 */
    /* ---------------------------------------------------------------- */

    public function slotsAction()
    {
        return $this->respond(function () {
            $date = $this->readDate($this->params()->fromQuery('date'));

            $serviceManager = @$this->getServiceLocator();
            $squareManager = $serviceManager->get('Square\Manager\SquareManager');
            $squareValidator = $serviceManager->get('Square\Service\SquareValidator');
            $pricingManager = $serviceManager->get('Square\Manager\SquarePricingManager');

            $squares = array();
            $slots = array();

            foreach ($squareManager->getAllVisible() as $sid => $square) {
                $block = (int) $square->need('time_block');
                $dayStart = $this->toSeconds($square->need('time_start'));
                $dayEnd = $this->toSeconds($square->need('time_end'));

                $squares[] = array(
                    'sid' => (int) $sid,
                    'name' => (string) $square->need('name'),
                    'block' => $block,
                    'cancelRange' => (int) $square->get('range_cancel', 0),
                );

                if ($block <= 0) {
                    continue;
                }

                for ($t = $dayStart; $t + $block <= $dayEnd; $t += $block) {
                    $timeStart = $this->toClock($t);
                    $timeEnd = $this->toClock($t + $block);

                    $slot = array(
                        'sid' => (int) $sid,
                        'start' => $timeStart,
                        'end' => $timeEnd,
                        'state' => 'free',
                        'price' => null,
                    );

                    if ($square->need('status') != 'enabled') {
                        $slot['state'] = 'closed';
                    } else {
                        try {
                            $check = $squareValidator->isBookable($date, $date, $timeStart, $timeEnd, $sid);

                            if (! $check['bookable']) {
                                $slot['state'] = 'taken';
                            } else {
                                $pricing = $pricingManager->getFinalPricingInRange(
                                    $check['dateStart'], $check['dateEnd'], $square, 1);

                                if ($pricing && isset($pricing['price'])) {
                                    $slot['price'] = (int) $pricing['price']; // Cent
                                    $slot['perQuantity'] = (bool) $pricing['per_quantity'];
                                }
                            }
                        } catch (RuntimeException $e) {
                            $slot['state'] = strpos($e->getMessage(), 'already over') !== false ? 'past' : 'closed';
                        }
                    }

                    $slots[] = $slot;
                }
            }

            return array(
                'date' => $date,
                'now' => date('c'),
                'squares' => $squares,
                'slots' => $slots,
            );
        });
    }

    /* ---------------------------------------------------------------- */
    /* POST /bridge/book                                                 */
    /* { date, name, email, phone?, note?, items: [{sid,start,end}] }    */
    /* ---------------------------------------------------------------- */

    public function bookAction()
    {
        return $this->respond(function () {
            $this->requirePost();

            $input = $this->readJson();
            $config = $this->bridgeConfig();

            $date = $this->readDate(isset($input['date']) ? $input['date'] : null);
            $name = trim(strip_tags((string) (isset($input['name']) ? $input['name'] : '')));
            $email = trim((string) (isset($input['email']) ? $input['email'] : ''));
            $phone = trim(strip_tags((string) (isset($input['phone']) ? $input['phone'] : '')));
            $note = trim(strip_tags((string) (isset($input['note']) ? $input['note'] : '')));
            $items = isset($input['items']) && is_array($input['items']) ? array_values($input['items']) : array();

            if (mb_strlen($name) < 3 || mb_strlen($name) > 100) {
                throw new BridgeException('Bitte gib deinen Vor- und Nachnamen an.', 422);
            }

            if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 128) {
                throw new BridgeException('Bitte gib eine gültige E-Mail-Adresse an.', 422);
            }

            if (! $items || count($items) > (int) $config['max_items']) {
                throw new BridgeException('Bitte wähle eine bis ' . (int) $config['max_items'] . ' Spielzeiten.', 422);
            }

            $serviceManager = @$this->getServiceLocator();
            $squareValidator = $serviceManager->get('Square\Service\SquareValidator');
            $bookingService = $serviceManager->get('Booking\Service\BookingService');
            $bookingManager = $serviceManager->get('Booking\Manager\BookingManager');

            /* Erst alles prüfen, dann buchen */

            $checks = array();

            foreach ($items as $i => $item) {
                $sid = isset($item['sid']) ? (int) $item['sid'] : 0;
                $start = isset($item['start']) ? (string) $item['start'] : '';
                $end = isset($item['end']) ? (string) $item['end'] : '';

                try {
                    $check = $squareValidator->isBookable($date, $date, $start, $end, $sid);
                } catch (RuntimeException $e) {
                    throw new BridgeException('Die Zeit ' . $start . ' Uhr ist nicht buchbar.', 409);
                }

                if (! $check['bookable'] || $check['square']->need('status') != 'enabled') {
                    throw new BridgeException('Die Zeit ' . $start . ' Uhr ist inzwischen belegt.', 409);
                }

                $checks[$i] = $check;
            }

            $user = $this->findOrCreateGuest($name, $email, $phone);

            $created = array();
            $failed = array();

            foreach ($checks as $i => $check) {
                $square = $check['square'];
                $token = bin2hex(random_bytes(16));

                $meta = array(
                    self::TOKEN_META => $token,
                    'notes' => trim("Gebucht über die neue Website.\n" . mb_substr($note, 0, 500)),
                );

                $booking = null;

                try {
                    // Direkt vor dem Schreiben erneut prüfen, damit zwei gleichzeitige Anfragen auffallen
                    $recheck = $squareValidator->isBookable($date, $date, $items[$i]['start'], $items[$i]['end'], $square->need('sid'));

                    if (! $recheck['bookable']) {
                        throw new BridgeException('inzwischen belegt', 409);
                    }

                    $booking = $bookingService->createSingle($user, $square, 1, $check['dateStart'], $check['dateEnd'], array(), $meta);
                } catch (BridgeException $e) {
                    $failed[] = array('sid' => (int) $square->need('sid'), 'start' => $items[$i]['start'], 'reason' => 'taken');
                    continue;
                } catch (Exception $e) {
                    // createSingle speichert zuerst und verschickt dann die Bestätigung. Scheitert nur der
                    // Mailversand, existiert die Buchung bereits: anhand des Tokens wiederfinden.
                    $booking = $this->findByToken($bookingManager, $user, $square, $token);

                    if (! $booking) {
                        $failed[] = array('sid' => (int) $square->need('sid'), 'start' => $items[$i]['start'], 'reason' => 'error');
                        continue;
                    }
                }

                $created[] = array(
                    'bid' => (int) $booking->need('bid'),
                    'token' => $token,
                    'sid' => (int) $square->need('sid'),
                    'square' => (string) $square->need('name'),
                    'date' => $date,
                    'start' => $check['dateStart']->format('H:i'),
                    'end' => $check['dateEnd']->format('H:i'),
                    'price' => $this->billTotal($booking),
                    'cancelUntil' => $this->cancelDeadline($square, $check['dateStart']),
                );
            }

            if (! $created) {
                throw new BridgeException('Die gewählten Zeiten sind inzwischen belegt. Es wurde nichts gebucht.', 409);
            }

            return array('bookings' => $created, 'failed' => $failed);
        });
    }

    /* ---------------------------------------------------------------- */
    /* POST /bridge/cancel   { bid, token }                              */
    /* ---------------------------------------------------------------- */

    public function cancelAction()
    {
        return $this->respond(function () {
            $this->requirePost();

            $input = $this->readJson();

            $serviceManager = @$this->getServiceLocator();
            $bookingService = $serviceManager->get('Booking\Service\BookingService');
            $squareManager = $serviceManager->get('Square\Manager\SquareManager');

            $booking = $this->loadWithToken(
                isset($input['bid']) ? $input['bid'] : null,
                isset($input['token']) ? $input['token'] : null);

            if ($booking->need('status') == 'cancelled') {
                return array('bid' => (int) $booking->need('bid'), 'status' => 'cancelled');
            }

            if ($booking->need('status') != 'single') {
                throw new BridgeException('Diese Buchung kann online nicht storniert werden.', 409);
            }

            $square = $squareManager->get($booking->need('sid'));
            $start = $this->firstStart($booking);
            $deadline = $start ? $this->cancelDeadline($square, $start) : null;

            // Gleiche Regel wie in ep-3: nur innerhalb der Stornofrist online stornierbar
            if (! $deadline || new DateTime($deadline) <= new DateTime()) {
                throw new BridgeException('Die Stornofrist ist abgelaufen. Bitte ruf an der Theke an.', 409);
            }

            try {
                $bookingService->cancelSingle($booking);
            } catch (Exception $e) {
                // Storno ist gespeichert, nur die Benachrichtigung kann gescheitert sein
                if ($booking->need('status') != 'cancelled') {
                    throw $e;
                }
            }

            return array('bid' => (int) $booking->need('bid'), 'status' => 'cancelled');
        });
    }

    /* ---------------------------------------------------------------- */
    /* GET /bridge/status?b=BID.TOKEN,BID.TOKEN                          */
    /* ---------------------------------------------------------------- */

    public function statusAction()
    {
        return $this->respond(function () {
            $pairs = array_filter(explode(',', (string) $this->params()->fromQuery('b')));

            if (count($pairs) > 25) {
                throw new BridgeException('Zu viele Buchungen angefragt.', 422);
            }

            $serviceManager = @$this->getServiceLocator();
            $squareManager = $serviceManager->get('Square\Manager\SquareManager');

            $result = array();

            foreach ($pairs as $pair) {
                $parts = explode('.', $pair, 2);

                try {
                    $booking = $this->loadWithToken($parts[0], isset($parts[1]) ? $parts[1] : null);
                } catch (BridgeException $e) {
                    $result[] = array('bid' => (int) $parts[0], 'status' => 'unknown');
                    continue;
                }

                $square = $squareManager->get($booking->need('sid'));
                $start = $this->firstStart($booking);

                $result[] = array(
                    'bid' => (int) $booking->need('bid'),
                    'status' => $booking->need('status') == 'cancelled' ? 'cancelled' : 'confirmed',
                    'cancelUntil' => $start ? $this->cancelDeadline($square, $start) : null,
                );
            }

            return array('bookings' => $result);
        });
    }

    /* ================================================================ */
    /* Hilfsfunktionen                                                   */
    /* ================================================================ */

    /**
     * Führt die Aktion aus und liefert immer JSON, auch im Fehlerfall.
     */
    protected function respond(callable $action)
    {
        $response = $this->getResponse();
        $headers = $response->getHeaders();

        $headers->addHeaderLine('Content-Type', 'application/json; charset=utf-8');
        $headers->addHeaderLine('Cache-Control', 'no-store');

        $config = $this->bridgeConfig();
        $originHeader = $this->getRequest()->getHeaders()->get('Origin');
        $origin = $originHeader ? $originHeader->getFieldValue() : null;

        if ($origin && in_array($origin, (array) $config['allowed_origins'], true)) {
            $headers->addHeaderLine('Access-Control-Allow-Origin', $origin);
            $headers->addHeaderLine('Vary', 'Origin');
            $headers->addHeaderLine('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            $headers->addHeaderLine('Access-Control-Allow-Headers', 'Content-Type');
        }

        if ($this->getRequest()->isOptions()) {
            $response->setStatusCode(204);
            $response->setContent('');

            return $response;
        }

        try {
            $data = $action();
            $response->setStatusCode(200);
        } catch (BridgeException $e) {
            $data = array('error' => $e->getMessage());
            $response->setStatusCode($e->getCode() ?: 400);
        } catch (Exception $e) {
            error_log('RspBridge: ' . $e->getMessage());

            $data = array('error' => 'Das hat gerade nicht geklappt. Bitte versuch es erneut.');
            $response->setStatusCode(500);
        }

        $response->setContent(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return $response;
    }

    protected function bridgeConfig()
    {
        $serviceManager = @$this->getServiceLocator();
        $config = $serviceManager->get('Config');

        return isset($config['rsp_bridge']) ? $config['rsp_bridge'] : array('allowed_origins' => array(), 'max_items' => 4);
    }

    protected function requirePost()
    {
        if (! $this->getRequest()->isPost()) {
            throw new BridgeException('Nur POST erlaubt.', 405);
        }
    }

    protected function readJson()
    {
        $input = json_decode((string) $this->getRequest()->getContent(), true);

        if (! is_array($input)) {
            throw new BridgeException('Ungültige Anfrage.', 400);
        }

        return $input;
    }

    protected function readDate($value)
    {
        $value = (string) $value;

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) || ! checkdate((int) substr($value, 5, 2), (int) substr($value, 8, 2), (int) substr($value, 0, 4))) {
            throw new BridgeException('Ungültiges Datum.', 422);
        }

        return $value;
    }

    protected function toSeconds($time)
    {
        $parts = explode(':', (string) $time);

        return (int) $parts[0] * 3600 + (isset($parts[1]) ? (int) $parts[1] * 60 : 0);
    }

    protected function toClock($seconds)
    {
        return sprintf('%02d:%02d', floor($seconds / 3600), ($seconds % 3600) / 60);
    }

    /**
     * Gastbuchung ohne Kundenkonto: Für die E-Mail-Adresse wird ein Platzhalter-Nutzer
     * verwendet, wie ihn ep-3 auch für telefonische Buchungen an der Theke anlegt.
     * Ein bestehendes, aktives Kundenkonto mit derselben Adresse wird wiederverwendet.
     */
    protected function findOrCreateGuest($name, $email, $phone)
    {
        $serviceManager = @$this->getServiceLocator();
        $userManager = $serviceManager->get('User\Manager\UserManager');

        $placeholder = null;

        foreach ($userManager->getBy(array('email' => $email)) as $candidate) {
            $status = $candidate->need('status');

            if (in_array($status, array('blocked', 'disabled', 'deleted'), true)) {
                throw new BridgeException('Mit dieser E-Mail-Adresse ist keine Online-Buchung möglich. Bitte ruf an der Theke an.', 403);
            }

            if ($status == 'enabled') {
                return $candidate;
            }

            if ($status == 'placeholder' && ! $placeholder) {
                $placeholder = $candidate;
            }
        }

        if ($placeholder) {
            return $placeholder;
        }

        $meta = array('name' => $name, 'bridge.guest' => 'true');

        if ($phone) {
            $meta['phone'] = mb_substr($phone, 0, 40);
        }

        return $userManager->create($name, 'placeholder', $email, bin2hex(random_bytes(16)), $meta);
    }

    protected function findByToken($bookingManager, $user, $square, $token)
    {
        $bookings = $bookingManager->getBy(array(
            'uid' => $user->need('uid'),
            'sid' => $square->need('sid'),
        ), 'bid DESC', 5);

        foreach ($bookings as $booking) {
            if (hash_equals((string) $booking->getMeta(self::TOKEN_META, ''), $token)) {
                return $booking;
            }
        }

        return null;
    }

    protected function loadWithToken($bid, $token)
    {
        if (! (is_numeric($bid) && $bid > 0 && is_string($token) && strlen($token) == 32)) {
            throw new BridgeException('Buchung nicht gefunden.', 404);
        }

        $serviceManager = @$this->getServiceLocator();
        $bookingManager = $serviceManager->get('Booking\Manager\BookingManager');

        $booking = $bookingManager->get($bid, false);

        if (! $booking || ! hash_equals((string) $booking->getMeta(self::TOKEN_META, ''), $token)) {
            throw new BridgeException('Buchung nicht gefunden.', 404);
        }

        return $booking;
    }

    protected function firstStart($booking)
    {
        $serviceManager = @$this->getServiceLocator();
        $reservationManager = $serviceManager->get('Booking\Manager\ReservationManager');

        $reservations = $reservationManager->getBy(array('bid' => $booking->need('bid')), 'date ASC, time_start ASC');
        $reservation = current($reservations);

        if (! $reservation) {
            return null;
        }

        return new DateTime($reservation->need('date') . ' ' . $reservation->need('time_start'));
    }

    protected function cancelDeadline($square, DateTime $start)
    {
        $range = (int) $square->get('range_cancel', 0);

        if (! $range) {
            return null;
        }

        $deadline = clone $start;
        $deadline->modify('-' . $range . ' sec');

        return $deadline->format('c');
    }

    protected function billTotal($booking)
    {
        $bills = $booking->getExtra('bills');

        if (! $bills) {
            return null;
        }

        $total = 0;

        foreach ($bills as $bill) {
            $total += (int) $bill->need('price');
        }

        return $total; // Cent
    }

}

class BridgeException extends RuntimeException
{
}
