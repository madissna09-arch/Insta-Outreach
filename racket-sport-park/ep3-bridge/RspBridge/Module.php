<?php

namespace RspBridge;

use Zend\ModuleManager\Feature\AutoloaderProviderInterface;
use Zend\ModuleManager\Feature\ConfigProviderInterface;

/**
 * Schlanke JSON-Schnittstelle für eine eigene Buchungsoberfläche.
 *
 * Das Modul nutzt ausschließlich die vorhandene Logik des ep-3 Buchungssystems
 * (Verfügbarkeit, Preise, Buchung, Storno). Buchungen landen damit in derselben
 * Datenbank und erscheinen unverändert in der ep-3-Verwaltung.
 */
class Module implements AutoloaderProviderInterface, ConfigProviderInterface
{

    public function getAutoloaderConfig()
    {
        return array(
            'Zend\Loader\StandardAutoloader' => array(
                'namespaces' => array(
                    __NAMESPACE__ => __DIR__ . '/src/' . __NAMESPACE__,
                ),
            ),
        );
    }

    public function getConfig()
    {
        return include __DIR__ . '/config/module.config.php';
    }

}
