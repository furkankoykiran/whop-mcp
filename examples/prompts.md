# whop-mcp — Example AI Prompts

This file contains ready-to-use prompts for AI assistants (Claude, Cursor, etc.) connected to the whop-mcp server. Copy and adapt them to manage your Whop.com business.

> ⚠️ **Disclaimer:** This is a community-led project and is **NOT** an official Whop.com product.

---

## 💰 Payments & Finance

```
Show me all payments from the last 30 days.
```

```
List the 10 most recent paid payments for product prod_xxxxxxxxxx.
```

```
Get the full details of payment pay_xxxxxxxxxx.
```

```
Refund payment pay_xxxxxxxxxx due to the customer's request.
```

```
Void payment pay_xxxxxxxxxx — it was created by mistake and hasn't been collected yet.
```

```
Give me a high-level financial summary for the current month (January 1 to January 31, 2025).
Include total revenue, refunds, fees, and a breakdown by payment status.
```

```
How many payments are in 'disputed' status right now?
```

```
Retry the failed payment pay_xxxxxxxxxx.
```

---

## 🫩 Memberships & Licenses

```
List all active memberships for product prod_xxxxxxxxxx.
```

```
Show me all expired memberships from the last 7 days.
```

```
Get full details for membership mem_xxxxxxxxxx, including license key and expiry date.
```

```
Is license key ABC-1234-XYZ still valid? Which user does it belong to?
```

```
Add 14 free days to membership mem_xxxxxxxxxx as a goodwill gesture.
```

```
Cancel membership mem_xxxxxxxxxx at period end — the customer wants to stop renewing.
```

```
Immediately terminate membership mem_xxxxxxxxxx — the customer violated our terms of service.
```

```
How many memberships are currently in 'past_due' status?
```

```
List all memberships for user user_xxxxxxxxxx across all my products.
```

---

## 📦 Products & Catalog

```
List all of my products with their plans and pricing.
```

```
Show me full details for product prod_xxxxxxxxxx, including all plans and experiences.
```

```
Create a new product called "Premium Signal Pack" with hidden visibility.
```

```
Archive product prod_xxxxxxxxxx — I'm discontinuing it.
```

```
List all pricing plans for product prod_xxxxxxxxxx and tell me which ones are active.
```

```
What's the difference in pricing between all plans for product prod_xxxxxxxxxx?
```

---

## 🎫 Promo Codes & Discounts

```
List all active promo codes.
```

```
Show me all promo codes that have been used more than 50 times.
```

```
Create a 20% off promo code called SUMMER25 that expires on July 31, 2025,
with a maximum of 100 uses. Apply it only to product prod_xxxxxxxxxx.
```

```
Create a $10 off promo code called WELCOME10 with unlimited uses and no expiry.
```

```
Disable promo code promo_xxxxxxxxxx — the campaign is over.
```

```
Delete promo code promo_xxxxxxxxxx.
```

```
How many uses does promo code BLACKFRIDAY24 have left?
```

---

## 🤝 Affiliates

```
List all my active affiliate partners and their earnings.
```

```
Who are my top 5 affiliates by total earnings this month?
```

```
Get detailed performance stats for affiliate aff_xxxxxxxxxx.
```

```
Give me a full summary of my affiliate program: total sales, payouts, and pending amounts.
```

```
Which affiliate has the highest conversion rate?
```

---

## 👥 Customers & Reviews

```
Look up user @john and show me their profile.
```

```
Find the customer who signed up with email customer@example.com and show their memberships.
```

```
Show me the 20 most recent customer reviews.
```

```
List all 1-star and 2-star reviews so I can follow up with unhappy customers.
```

```
What's my average customer review rating? Show me the distribution by star count.
```

```
Are there any reviews mentioning issues from the last 7 days?
```

---

## 🧠 Multi-Domain Analysis

```
Give me a complete business overview:
1. Total revenue this month
2. Number of active memberships
3. Average review rating
4. Top affiliate by sales
5. Most-used promo code
```

```
A customer says their license isn't working. Their email is customer@example.com.
Find their membership, verify the license key, and check if their access is still valid.
```

```
I want to run a Black Friday campaign:
1. List all my products and plans
2. Create a promo code BLACKFRIDAY30 for 30% off, limited to 500 uses, expiring November 30, 2025
3. Confirm the code was created successfully
```

```
Find all memberships that expire in the next 7 days and list the user IDs so I can reach out.
```

```
Compare revenue between plan_xxxxxxxxxx and plan_yyyyyyyyyy over the last 30 days.
```
