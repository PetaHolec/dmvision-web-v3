<?php
/**
 * D&M Vision – odeslání poptávky z webu e-mailem.
 *
 * Nastavení je v $config níže. Na hostingu WEDOS funguje PHP funkce mail()
 * bez dalšího nastavení; adresa odesílatele (from) musí být na doméně dmvision.cz.
 * Formulář posílá JSON odpověď (když ho odešle JavaScript), jinak přesměruje
 * na /dekujeme/ nebo zobrazí chybu.
 */
declare(strict_types=1);

$config = [
    'to'          => 'info@dmvision.cz',
    'from'        => 'info@dmvision.cz',
    'from_name'   => 'Web D&M Vision',
    'success'     => '/dekujeme/',
    'max_files'   => 3,
    'max_bytes'   => 10 * 1024 * 1024,
    'allowed_ext' => ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'key', 'odt', 'txt', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'zip'],
];

date_default_timezone_set('Europe/Prague');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

$wantsJson = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $error = '', int $code = 200): void
{
    global $wantsJson, $config;
    if ($wantsJson) {
        http_response_code($ok ? 200 : $code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } elseif ($ok) {
        header('Location: ' . $config['success'], true, 303);
    } else {
        http_response_code($code);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<meta name="robots" content="noindex"><title>Poptávku se nepodařilo odeslat</title>'
            . '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:12vh auto;padding:0 20px;line-height:1.6">'
            . '<h1>Poptávku se nepodařilo odeslat</h1><p>' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</p>'
            . '<p><a href="javascript:history.back()">Zpět na formulář</a> · <a href="mailto:info@dmvision.cz">info@dmvision.cz</a>'
            . '</p></body></html>';
    }
    exit;
}

function cut(string $value, int $max): string
{
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

function field(string $name, int $max = 500, bool $multiline = false): string
{
    $v = $_POST[$name] ?? '';
    if (!is_string($v)) {
        return '';
    }
    $v = trim(strip_tags($v));
    $v = (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    if (!$multiline) {
        $v = trim((string) preg_replace('/\s+/u', ' ', $v));
    }
    return cut($v, $max);
}

function mime_for(string $ext): string
{
    $map = [
        'pdf' => 'application/pdf', 'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'odt' => 'application/vnd.oasis.opendocument.text', 'txt' => 'text/plain',
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp',
        'heic' => 'image/heic', 'zip' => 'application/zip',
    ];
    return $map[$ext] ?? 'application/octet-stream';
}

function mime_header(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /poptavka/', true, 303);
    exit;
}

// Ochrana proti spamu: skryté pole musí zůstat prázdné, formulář nesmí být odeslán do 3 s od načtení.
if (!empty($_POST['web'])) {
    respond(true);
}
if (isset($_POST['elapsed']) && $_POST['elapsed'] !== '' && (int) $_POST['elapsed'] < 3) {
    respond(false, 'Formulář byl odeslán příliš rychle. Zkuste to prosím znovu.', 400);
}

$jmeno    = field('jmeno', 120);
$firma    = field('firma', 160);
$email    = field('email', 160);
$telefon  = field('telefon', 40);
$rozpocet = field('rozpocet', 60);
$termin   = field('termin', 160);
$lokalita = field('lokalita', 160);
$kontakt  = field('kontakt', 20);
$zdroj    = field('zdroj', 200);
$zprava   = field('zprava', 5000, true);

$sluzby = [];
if (isset($_POST['sluzby']) && is_array($_POST['sluzby'])) {
    foreach ($_POST['sluzby'] as $s) {
        $s = is_string($s) ? trim(strip_tags($s)) : '';
        if ($s !== '') {
            $sluzby[] = cut($s, 60);
        }
    }
}
$sluzby = array_slice(array_values(array_unique($sluzby)), 0, 10);

$missing = [];
if ($jmeno === '') {
    $missing[] = 'jméno';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $missing[] = 'platný e-mail';
}
if ($zprava === '') {
    $missing[] = 'popis poptávky';
}
if ($missing) {
    respond(false, 'Vyplňte prosím: ' . implode(', ', $missing) . '.', 422);
}
if (preg_match_all('~https?://~i', $zprava) > 5) {
    respond(false, 'Zpráva obsahuje příliš mnoho odkazů.', 422);
}

// Přílohy (nepovinné)
$attachments = [];
if (!empty($_FILES['prilohy']['name']) && is_array($_FILES['prilohy']['name'])) {
    $total = 0;
    foreach ($_FILES['prilohy']['name'] as $i => $original) {
        $err = $_FILES['prilohy']['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($err !== UPLOAD_ERR_OK) {
            respond(false, 'Přílohu se nepodařilo nahrát – může být příliš velká.', 400);
        }
        if (count($attachments) >= $config['max_files']) {
            respond(false, 'Nahrajte prosím nejvýš 3 soubory.', 400);
        }
        $name = basename((string) $original);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($ext, $config['allowed_ext'], true)) {
            respond(false, 'Soubor „' . $name . '“ má nepodporovaný formát.', 400);
        }
        $tmp = $_FILES['prilohy']['tmp_name'][$i];
        if (!is_uploaded_file($tmp)) {
            respond(false, 'Přílohu se nepodařilo zpracovat.', 400);
        }
        $total += (int) filesize($tmp);
        if ($total > $config['max_bytes']) {
            respond(false, 'Přílohy mají dohromady víc než 10 MB. Pošlete prosím odkaz ke stažení.', 400);
        }
        $ascii = function_exists('iconv') ? (string) @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) : $name;
        $safe = trim((string) preg_replace('/[^A-Za-z0-9._-]+/', '-', $ascii), '-.');
        $attachments[] = [
            'name' => $safe !== '' ? $safe : 'priloha-' . ($i + 1) . '.' . $ext,
            'type' => mime_for($ext),
            'data' => (string) file_get_contents($tmp),
        ];
    }
}

$dash = '—';
$lines = [
    'Nová poptávka z webu dmvision.cz',
    str_repeat('=', 44),
    'Jméno:       ' . $jmeno,
    'Firma:       ' . ($firma !== '' ? $firma : $dash),
    'E-mail:      ' . $email,
    'Telefon:     ' . ($telefon !== '' ? $telefon : $dash),
    'Kontaktovat: ' . ($kontakt !== '' ? $kontakt : $dash),
    'Služby:      ' . ($sluzby ? implode(', ', $sluzby) : $dash),
    'Rozpočet:    ' . ($rozpocet !== '' ? $rozpocet : $dash),
    'Termín:      ' . ($termin !== '' ? $termin : $dash),
    'Místo:       ' . ($lokalita !== '' ? $lokalita : $dash),
    'Přílohy:     ' . ($attachments ? implode(', ', array_column($attachments, 'name')) : $dash),
    '',
    'Zpráva:',
    $zprava,
    '',
    str_repeat('-', 44),
    'Odesláno ' . date('j. n. Y H:i') . ' ze stránky ' . ($zdroj !== '' ? $zdroj : $dash),
    'Odpovědět můžete přímo na tento e-mail.',
];
$body = implode("\r\n", $lines);
$subject = 'Poptávka z webu: ' . ($sluzby ? implode(', ', $sluzby) : 'obecná') . ' – ' . $jmeno;

$headers = [
    'From: ' . mime_header($config['from_name']) . ' <' . $config['from'] . '>',
    'Reply-To: ' . mime_header($jmeno) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'X-Mailer: dmvision-web',
];
if ($attachments) {
    $boundary = 'dmv-' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
    $message = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($body));
    foreach ($attachments as $a) {
        $message .= "--{$boundary}\r\nContent-Type: {$a['type']}; name=\"{$a['name']}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$a['name']}\"\r\n\r\n"
            . chunk_split(base64_encode($a['data']));
    }
    $message .= "--{$boundary}--";
} else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: base64';
    $message = chunk_split(base64_encode($body));
}

$headerString = implode("\r\n", $headers);
$sent = @mail($config['to'], mime_header($subject), $message, $headerString, '-f' . $config['from']);
if (!$sent) {
    $sent = @mail($config['to'], mime_header($subject), $message, $headerString);
}
if (!$sent) {
    respond(false, 'E-mail se nepodařilo odeslat.', 500);
}
respond(true);
