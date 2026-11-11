<?php

return array(
    'rsp_bridge' => array(
        /*
         * Adressen, von denen die neue Oberfläche die Schnittstelle aufrufen darf,
         * z. B. 'https://www.racketsportpark.de'. Leer = nur dieselbe Adresse.
         * Eigene Werte gehören in config/autoload/local.php.
         */
        'allowed_origins' => array(),

        /* Höchstzahl Spielzeiten pro Buchungsvorgang */
        'max_items' => 4,
    ),

    'router' => array(
        'routes' => array(
            'rsp-bridge' => array(
                'type' => 'Literal',
                'options' => array(
                    'route' => '/bridge',
                    'defaults' => array(
                        'controller' => 'RspBridge\Controller\Bridge',
                    ),
                ),
                'may_terminate' => false,
                'child_routes' => array(
                    'slots' => array(
                        'type' => 'Literal',
                        'options' => array('route' => '/slots', 'defaults' => array('action' => 'slots')),
                    ),
                    'book' => array(
                        'type' => 'Literal',
                        'options' => array('route' => '/book', 'defaults' => array('action' => 'book')),
                    ),
                    'cancel' => array(
                        'type' => 'Literal',
                        'options' => array('route' => '/cancel', 'defaults' => array('action' => 'cancel')),
                    ),
                    'status' => array(
                        'type' => 'Literal',
                        'options' => array('route' => '/status', 'defaults' => array('action' => 'status')),
                    ),
                ),
            ),
        ),
    ),

    'controllers' => array(
        'invokables' => array(
            'RspBridge\Controller\Bridge' => 'RspBridge\Controller\BridgeController',
        ),
    ),
);
