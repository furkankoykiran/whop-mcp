// ============================================================
//  Whop API – Shared Types
//  All interfaces are modelled on the Whop Company API v1/v2
// ============================================================

export interface WhopApiError {
    error: string;
    message: string;
    status: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        current_page: number;
        total_page: number;
        total_count: number;
    };
}

// ─── Payments ────────────────────────────────────────────────

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    billing_reason: string;
    payment_method: string;
    created_at: number;
    last_payment_attempt: number | null;
    paid_at: number | null;
    refunded_at: number | null;
    user_id: string;
    product_id: string | null;
    plan_id: string | null;
    membership_id: string | null;
    company_id: string;
    subtotal: number;
    discount_amount: number;
    fee_amount: number;
    tax_amount: number;
    refund_amount: number;
}

export interface Invoice {
    id: string;
    payment_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: number;
}

// ─── Memberships ─────────────────────────────────────────────

export interface Membership {
    id: string;
    user_id: string;
    product_id: string;
    plan_id: string | null;
    status: string;
    valid: boolean;
    wallet_address: string | null;
    license_key: string | null;
    metadata: Record<string, unknown> | null;
    quantity: number;
    expires_at: number | null;
    renewal_period_start: number | null;
    renewal_period_end: number | null;
    created_at: number;
    manage_url: string;
    discord_account_id: string | null;
    email: string | null;
}

// ─── Products ────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    title?: string;
    visibility: string;
    created_at: number;
    experiences: (Experience | string)[];
    plans: (Plan | string)[];
    company_id: string;
    image: string | null;
    description: string | null;
    slug: string | null;
    headless: boolean;
}

export interface Experience {
    id: string;
    name: string;
    product_id: string;
    experience_type: string;
    permission_level: string;
}

export interface Plan {
    id: string;
    name: string | null;
    billing_period: string | null;
    renewal_price: number | string;
    initial_price: number | string;
    currency?: string;
    base_currency?: string;
    visibility: string;
    product_id?: string;
    product?: string;
    created_at: number;
}

// ─── Promo Codes ─────────────────────────────────────────────

export interface PromoCode {
    id: string;
    code: string;
    discount_type: string;
    discount_amount: number;
    currency: string | null;
    status: string;
    unlimited: boolean;
    quantity: number | null;
    used_count: number;
    expiry_date: number | null;
    created_at: number;
    base_currency: string | null;
    products: string[] | null;
    plans: string[] | null;
}

// ─── Reviews ─────────────────────────────────────────────────

export interface Review {
    id: string;
    user_id: string;
    product_id: string;
    company_id: string;
    rating: number;
    message: string | null;
    created_at: number;
    username: string | null;
}

// ─── Users ───────────────────────────────────────────────────

export interface WhopUser {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    profile_pic_url: string | null;
    created_at: number;
    twitter_username: string | null;
    discord_id: string | null;
}

// ─── Affiliates ──────────────────────────────────────────────

export interface Affiliate {
    id: string;
    user_id: string;
    company_id: string;
    affiliate_code: string;
    commission_type: string;
    commission_value: number;
    status: string;
    total_earnings: number;
    pending_earnings: number;
    paid_earnings: number;
    total_sales: number;
    created_at: number;
}

export interface AffiliateLink {
    id: string;
    affiliate_id: string;
    product_id: string | null;
    url: string;
    clicks: number;
    conversions: number;
    created_at: number;
}

// ─── Company ─────────────────────────────────────────────────

export interface Company {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
    created_at: number;
    twitter: string | null;
    discord: string | null;
}
