<?php
ini_set('display_errors', 1);
session_start();
error_reporting(E_ALL);

// CORS Headers für Frontend-Zugriff
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Datei-Konfiguration
$dataFiles = [
    'hydrants' => __DIR__ . '/data/hydrants.json',
    'markers' => __DIR__ . '/data/custom_markers.json',
    'pois' => __DIR__ . '/data/points_of_interest.json',
    'drawings' => __DIR__ . '/data/drawings.json',
    'settings' => __DIR__ . '/data/settings.json',
    'backup' => __DIR__ . '/data/backup_'
];

// Verzeichnis erstellen falls nicht vorhanden
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Request Methode und Aktion bestimmen
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$type = $_GET['type'] ?? '';
const DATA_TYPES = ['hydrants', 'markers', 'drawings', 'settings', 'pois'];

// Logging Funktion
function logAction($action, $type, $success = true, $message = '')
{
    $logFile = __DIR__ . '/data/activity.log';
    $timestamp = date('Y-m-d H:i:s');
    $status = $success ? 'SUCCESS' : 'ERROR';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

    $logEntry = "[{$timestamp}] {$status}: {$action} - {$type} - IP: {$ip} - {$message}\n";

    // Stelle sicher dass das Log-Verzeichnis existiert
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// GET - Daten laden
if ($method === 'GET') {
    switch ($action) {
        case 'load':
            if (!$type || !array_key_exists($type, $dataFiles)) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültiger Datentyp']);
                exit;
            }

            $filename = $dataFiles[$type];
            if (file_exists($filename)) {
                $data = file_get_contents($filename);
                $json = json_decode($data, true);

                if ($json !== null) {
                    logAction('LOAD', $type, true);
                    echo json_encode([
                        'success' => true,
                        'data' => $json,
                        'timestamp' => filemtime($filename)
                    ]);
                } else {
                    logAction('LOAD', $type, false, 'Invalid JSON');
                    http_response_code(500);
                    echo json_encode(['error' => 'Datei beschädigt']);
                }
            } else {
                // Leere Standarddaten zurückgeben
                $defaultData = getDefaultData($type);
                echo json_encode([
                    'success' => true,
                    'data' => $defaultData,
                    'timestamp' => time()
                ]);
            }
            break;

        case 'list_backups':
            $backups = [];
            $pattern = $dataFiles['backup'] . '*.json';
            foreach (glob($pattern) as $file) {
                $backups[] = [
                    'filename' => basename($file),
                    'timestamp' => filemtime($file),
                    'size' => filesize($file),
                    'date' => date('Y-m-d H:i:s', filemtime($file))
                ];
            }

            // Nach Datum sortieren (neueste zuerst)
            usort($backups, function ($a, $b) {
                return $b['timestamp'] - $a['timestamp'];
            });

            echo json_encode(['success' => true, 'backups' => $backups]);
            break;

        case 'stats':
            $stats = [];
            foreach ($dataFiles as $type => $file) {
                if ($type === 'backup') continue;

                if (file_exists($file)) {
                    $data = json_decode(file_get_contents($file), true);
                    $stats[$type] = [
                        'count' => is_array($data) ? count($data) : (isset($data['features']) ? count($data['features']) : 0),
                        'last_modified' => date('Y-m-d H:i:s', filemtime($file)),
                        'size' => filesize($file)
                    ];
                } else {
                    $stats[$type] = [
                        'count' => 0,
                        'last_modified' => null,
                        'size' => 0
                    ];
                }
            }

            echo json_encode(['success' => true, 'stats' => $stats]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unbekannte Aktion']);
    }
    exit;
}

// POST - Daten speichern
if ($method === 'POST') {
    $input = file_get_contents("php://input");
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Keine Daten empfangen']);
        exit;
    }

    $requestData = json_decode($input, true);
    if ($requestData === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültiges JSON']);
        exit;
    }

    switch ($action) {
        case 'save':
            if (!$type || !array_key_exists($type, $dataFiles)) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültiger Datentyp']);
                exit;
            }

            $filename = $dataFiles[$type];
            $data = $requestData['data'] ?? $requestData;

            // Backup der aktuellen Datei erstellen
            if (file_exists($filename)) {
                $backupName = $dataFiles['backup'] . $type . '_' . date('Y-m-d_H-i-s') . '.json';
                copy($filename, $backupName);
            }

            // Daten validieren
            if (!validateData($type, $data)) {
                logAction('SAVE', $type, false, 'Data validation failed');
                http_response_code(400);
                echo json_encode(['error' => 'Datenvalidierung fehlgeschlagen']);
                exit;
            }

            // Daten speichern
            if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                // ✅ KORRIGIERTE COUNT BERECHNUNG
                $count = is_array($data) ? count($data) : (isset($data['features']) ? count($data['features']) : 0);
                logAction('SAVE', $type, true, $count . ' items');
                echo json_encode([
                    'success' => true,
                    'message' => ucfirst($type) . ' erfolgreich gespeichert',
                    'timestamp' => time(),
                    'count' => $count
                ]);
            } else {
                logAction('SAVE', $type, false, 'File write failed');
                http_response_code(500);
                echo json_encode(['error' => 'Fehler beim Speichern']);
            }
            break;

        case 'save_all':
            $allData = $requestData['data'] ?? [];
            $results = [];
            $success = true;

            foreach (DATA_TYPES as $dataType) {
                if (isset($allData[$dataType])) {
                    $filename = $dataFiles[$dataType];
                    $data = $allData[$dataType];

                    if (validateData($dataType, $data)) {
                        if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                            $results[$dataType] = 'success';
                            logAction('SAVE_ALL', $dataType, true);
                        } else {
                            $results[$dataType] = 'error';
                            $success = false;
                            logAction('SAVE_ALL', $dataType, false, 'File write failed');
                        }
                    } else {
                        $results[$dataType] = 'validation_error';
                        $success = false;
                        logAction('SAVE_ALL', $dataType, false, 'Validation failed');
                    }
                }
            }

            echo json_encode([
                'success' => $success,
                'results' => $results,
                'timestamp' => time()
            ]);
            break;

        case 'create_backup':
            $backupData = [
                'timestamp' => time(),
                'version' => '2.1',
                'created_by' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'data' => []
            ];

            // Alle Datentypen in Backup aufnehmen
            foreach (DATA_TYPES as $dataType) {
                $filename = $dataFiles[$dataType];
                if (file_exists($filename)) {
                    $data = json_decode(file_get_contents($filename), true);
                    $backupData['data'][$dataType] = $data;
                }
            }

            $backupFilename = $dataFiles['backup'] . 'full_' . date('Y-m-d_H-i-s') . '.json';

            if (file_put_contents($backupFilename, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                // Alte Backups löschen (nur letzten 20 behalten)
                cleanupOldBackups();

                logAction('CREATE_BACKUP', 'full', true);
                echo json_encode([
                    'success' => true,
                    'message' => 'Backup erfolgreich erstellt',
                    'filename' => basename($backupFilename),
                    'timestamp' => time()
                ]);
            } else {
                logAction('CREATE_BACKUP', 'full', false);
                http_response_code(500);
                echo json_encode(['error' => 'Backup konnte nicht erstellt werden']);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unbekannte Aktion']);
    }
    exit;
}

// PUT - Backup laden
if ($method === 'PUT') {
    if ($action === 'restore_backup') {
        $input = file_get_contents("php://input");
        $requestData = json_decode($input, true);
        $backupFilename = $requestData['filename'] ?? '';

        if (!$backupFilename) {
            http_response_code(400);
            echo json_encode(['error' => 'Kein Backup-Dateiname angegeben']);
            exit;
        }

        $backupPath = $dataDir . '/' . $backupFilename;

        if (!file_exists($backupPath)) {
            http_response_code(404);
            echo json_encode(['error' => 'Backup-Datei nicht gefunden']);
            exit;
        }

        $backupData = json_decode(file_get_contents($backupPath), true);
        if (!$backupData || !isset($backupData['data'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Ungültiges Backup-Format']);
            exit;
        }

        $results = [];
        $success = true;

        // Aktuelle Daten als Sicherung speichern
        $restoreBackupName = $dataFiles['backup'] . 'pre_restore_' . date('Y-m-d_H-i-s') . '.json';
        $currentData = [];
        foreach (DATA_TYPES as $dataType) {
            $filename = $dataFiles[$dataType];
            if (file_exists($filename)) {
                $currentData[$dataType] = json_decode(file_get_contents($filename), true);
            }
        }
        file_put_contents($restoreBackupName, json_encode(['data' => $currentData], JSON_PRETTY_PRINT));

        // Backup-Daten wiederherstellen
        foreach ($backupData['data'] as $dataType => $data) {
            if (array_key_exists($dataType, $dataFiles)) {
                $filename = $dataFiles[$dataType];

                if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                    $results[$dataType] = 'restored';
                    logAction('RESTORE', $dataType, true);
                } else {
                    $results[$dataType] = 'error';
                    $success = false;
                    logAction('RESTORE', $dataType, false);
                }
            }
        }

        echo json_encode([
            'success' => $success,
            'results' => $results,
            'restored_from' => $backupFilename,
            'timestamp' => time()
        ]);
    }
    exit;
}

// DELETE - Daten löschen
if ($method === 'DELETE') {
    switch ($action) {
        case 'clear':
            if (!$type || !array_key_exists($type, $dataFiles)) {
                http_response_code(400);
                echo json_encode(['error' => 'Ungültiger Datentyp']);
                exit;
            }

            $filename = $dataFiles[$type];
            if (file_exists($filename)) {
                // Backup vor Löschung
                $backupName = $dataFiles['backup'] . $type . '_before_clear_' . date('Y-m-d_H-i-s') . '.json';
                copy($filename, $backupName);

                if (unlink($filename)) {
                    logAction('CLEAR', $type, true);
                    echo json_encode(['success' => true, 'message' => ucfirst($type) . ' gelöscht']);
                } else {
                    logAction('CLEAR', $type, false);
                    http_response_code(500);
                    echo json_encode(['error' => 'Fehler beim Löschen']);
                }
            } else {
                echo json_encode(['success' => true, 'message' => 'Keine Daten vorhanden']);
            }
            break;

        case 'clear_all':
            $results = [];
            $success = true;

            // Backup aller Daten erstellen
            $clearBackupName = $dataFiles['backup'] . 'before_clear_all_' . date('Y-m-d_H-i-s') . '.json';
            $allCurrentData = [];

            foreach (DATA_TYPES as $dataType) {
                $filename = $dataFiles[$dataType];
                if (file_exists($filename)) {
                    $allCurrentData[$dataType] = json_decode(file_get_contents($filename), true);

                    if (unlink($filename)) {
                        $results[$dataType] = 'cleared';
                        logAction('CLEAR_ALL', $dataType, true);
                    } else {
                        $results[$dataType] = 'error';
                        $success = false;
                        logAction('CLEAR_ALL', $dataType, false);
                    }
                }
            }

            file_put_contents($clearBackupName, json_encode(['data' => $allCurrentData], JSON_PRETTY_PRINT));

            echo json_encode([
                'success' => $success,
                'results' => $results,
                'backup_created' => basename($clearBackupName)
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unbekannte Aktion']);
    }
    exit;
}

// Hilfsfunktionen
function getDefaultData($type)
{
    switch ($type) {
        case 'hydrants':
            return [];
        case 'markers':
            return [];
        case 'pois':
            return [];
        case 'drawings':
            return ['type' => 'FeatureCollection', 'features' => []];
        case 'settings':
            return ['autoSaveEnabled' => true, 'isAdmin' => false];
        default:
            return [];
    }
}

function validateData($type, $data)
{
    switch ($type) {
        case 'hydrants':
            if (!is_array($data)) return false;
            foreach ($data as $hydrant) {
                if (!isset($hydrant['id'], $hydrant['lng'], $hydrant['lat'])) {
                    return false;
                }
            }
            return true;

        case 'markers':
            if (!is_array($data)) return false;
            foreach ($data as $marker) {
                if (!isset($marker['id'], $marker['lng'], $marker['lat'], $marker['name'])) {
                    return false;
                }
            }
            return true;

        case 'pois':
            if (!is_array($data)) return false;
            foreach ($data as $poi) {
                if (
                    !isset($poi['id'], $poi['lng'], $poi['lat'], $poi['name'], $poi['category']) ||
                    !in_array($poi['category'], ['gas_station', 'windmill', 'power_plant', 'oil_pump', 'tanks'])
                ) {
                    return false;
                }
            }
            return true;

        case 'drawings':
            // ✅ KORRIGIERTE VALIDIERUNG FÜR DRAWINGS
            // Prüfe ob es ein Objekt/Array ist
            if (!is_array($data) && !is_object($data)) {
                return false;
            }

            // Konvertiere zu Array falls es ein Objekt ist
            $dataArray = (array) $data;

            // Muss GeoJSON FeatureCollection sein
            if (!isset($dataArray['type']) || $dataArray['type'] !== 'FeatureCollection') {
                return false;
            }

            // Features muss ein Array sein (kann leer sein)
            if (!isset($dataArray['features']) || !is_array($dataArray['features'])) {
                return false;
            }

            // Validiere jedes Feature (nur grundlegend für Performance)
            foreach ($dataArray['features'] as $feature) {
                $featureArray = (array) $feature;
                if (!isset($featureArray['type']) || $featureArray['type'] !== 'Feature') {
                    return false;
                }
                if (!isset($featureArray['geometry']) || !is_array($featureArray['geometry']) && !is_object($featureArray['geometry'])) {
                    return false;
                }
                $geometry = (array) $featureArray['geometry'];
                if (!isset($geometry['type']) || !isset($geometry['coordinates'])) {
                    return false;
                }
            }

            return true;

        case 'settings':
            return is_array($data) || is_object($data);

        default:
            return true;
    }
}

function cleanupOldBackups()
{
    $pattern = $GLOBALS['dataFiles']['backup'] . '*.json';
    $backups = glob($pattern);

    if (count($backups) > 20) {
        // Nach Änderungszeit sortieren
        usort($backups, function ($a, $b) {
            return filemtime($a) - filemtime($b);
        });

        // Älteste löschen
        $toDelete = array_slice($backups, 0, count($backups) - 20);
        foreach ($toDelete as $file) {
            unlink($file);
        }
    }
}

http_response_code(405);
echo json_encode(['error' => 'Methode nicht erlaubt']);
