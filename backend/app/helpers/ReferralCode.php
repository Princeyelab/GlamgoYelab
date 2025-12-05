<?php

namespace App\Helpers;

class ReferralCode
{
    /**
     * Génère un code de parrainage unique
     */
    public static function generate(int $length = 8): string
    {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Pas de I, O, 0, 1 pour éviter la confusion
        $code = '';

        for ($i = 0; $i < $length; $i++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }

        return $code;
    }

    /**
     * Génère un code unique qui n'existe pas en base
     */
    public static function generateUnique(\PDO $db): string
    {
        do {
            $code = self::generate();
            $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE referral_code = ?");
            $stmt->execute([$code]);
            $exists = $stmt->fetchColumn() > 0;
        } while ($exists);

        return $code;
    }
}
