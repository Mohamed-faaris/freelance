// ============================
// PERMISSION BIT POSITIONS
// ============================
export enum PermissionBit {
    NEWS_VIEW = 0,
    BUSINESSVIEW = 1,
    FSSAI_VERIFICATION_VIEW = 2,
    VERIFICATION_MINI_VIEW = 3,
    VERIFICATION_LITE_VIEW = 4,
    VERIFICATION_ADVANCED_VIEW = 5,
}

// ============================
// PERMISSION VALUES
// ============================
export const PERMISSIONS = {
    NEWS_VIEW: BigInt(1) << BigInt(PermissionBit.NEWS_VIEW),
    BUSINESSVIEW: BigInt(1) << BigInt(PermissionBit.BUSINESSVIEW),
    FSSAI_VERIFICATION_VIEW: BigInt(1) << BigInt(PermissionBit.FSSAI_VERIFICATION_VIEW),
    VERIFICATION_MINI_VIEW: BigInt(1) << BigInt(PermissionBit.VERIFICATION_MINI_VIEW),
    VERIFICATION_LITE_VIEW: BigInt(1) << BigInt(PermissionBit.VERIFICATION_LITE_VIEW),
    VERIFICATION_ADVANCED_VIEW: BigInt(1) << BigInt(
        PermissionBit.VERIFICATION_ADVANCED_VIEW
    ),
};

// ============================
// ROLE PRESETS
// ============================
export const ROLE_PRESETS = {
    USER: BigInt(1), // Only news:view (bit 0)
    ADMIN: BigInt(63), // All 6 permissions (bits 0-5)
};

// ============================
// PERMISSION NAMES MAPPING
// ============================
const permissionNameMap: Record<PermissionBit, string> = {
    [PermissionBit.NEWS_VIEW]: "news:view",
    [PermissionBit.BUSINESSVIEW]: "businessview",
    [PermissionBit.FSSAI_VERIFICATION_VIEW]: "fssai-verification:view",
    [PermissionBit.VERIFICATION_MINI_VIEW]: "verification-mini:view",
    [PermissionBit.VERIFICATION_LITE_VIEW]: "verification-lite:view",
    [PermissionBit.VERIFICATION_ADVANCED_VIEW]: "verification-advanced:view",
};

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Check if permissions include a specific permission
 */
export function hasPermission(
    permissions: bigint,
    permission: bigint
): boolean {
    return (permissions & permission) === permission;
}

/**
 * Add a permission to the permissions set
 */
export function addPermission(
    permissions: bigint,
    permission: bigint
): bigint {
    return permissions | permission;
}

/**
 * Remove a permission from the permissions set
 */
export function removePermission(
    permissions: bigint,
    permission: bigint
): bigint {
    return permissions & ~permission;
}

/**
 * Toggle a permission in the permissions set
 */
export function togglePermission(
    permissions: bigint,
    permission: bigint
): bigint {
    return permissions ^ permission;
}

/**
 * Get the permission name for a given bit position
 */
export function getPermissionName(bit: PermissionBit): string {
    return permissionNameMap[bit] || "unknown";
}

/**
 * Get all permission names from a permissions BigInt
 */
export function getPermissionNames(permissions: bigint): string[] {
    const names: string[] = [];

    for (let bit = 0; bit <= 5; bit++) {
        const permission = BigInt(1) << BigInt(bit);
        if (hasPermission(permissions, permission)) {
            names.push(getPermissionName(bit as PermissionBit));
        }
    }

    return names;
}

/**
 * Get bit value from permission name
 */
export function getPermissionBitByName(name: string): bigint | null {
    const entry = Object.entries(permissionNameMap).find(([_, v]) => v === name);
    if (entry) {
        const bit = parseInt(entry[0]);
        return BigInt(1) << BigInt(bit);
    }
    return null;
}

/**
 * Create permissions from an array of permission names
 */
export function createPermissionsFromNames(names: string[]): bigint {
    let permissions = BigInt(0);
    for (const name of names) {
        const bit = getPermissionBitByName(name);
        if (bit) {
            permissions = addPermission(permissions, bit);
        }
    }
    return permissions;
}