# 🐛 Bug Report: Saved Card Count Not Increasing

**Date:** April 28, 2026  
**Reported by:** Khant Linn Maung Maung  
**Severity:** Medium  
**Status:** Investigating

---

## 1. Issue Summary

The **"保存済みカード" (Saved Cards) count** on the Bookmark panel is frozen and does not update when the user saves new vocabulary cards. The count remains stuck at **"29 語"** regardless of new cards being added.

---

## 2. UI Description

The Bookmark panel on the right side of the app shows:

- **Header:** 「保存済みカード一覧」(Saved Cards List)
- **Count display:** 「保存済み 29 語」(29 words saved) — **this value does not change**
- **Search bar:** 「語を検索...」(Search words...)
- **Card list:** Shows saved vocabulary items with English terms and Japanese translations

Example saved cards visible:
- RIP (Rural Immunization Program)【Tier 1】
- SQLインジェクション (SQL Injection)
- IDS (Intrusion Detection System)【Tier 1】
- SLA (Service Level Agreement)【Tier 1】

---

## 3. Expected Behavior

When a user toggles the bookmark/save switch on a vocabulary card in the main study view, the card should:
1. Appear in the "保存済みカード一覧" list
2. Increment the "保存済み X 語" counter by 1

---

## 4. Actual Behavior

- The counter shows **29 語** and never increases
- The card list appears to show only a subset of saved cards (only 3 visible in the screenshot)
- New cards are not reflected in the count

---

## 5. Possible Causes

| # | Possible Cause | Likelihood |
|---|---------------|------------|
| 1 | Frontend counter not re-rendering after Supabase write | High |
| 2 | Supabase `bookmarks` table insert failing silently | Medium |
| 3 | React state not updating after toggle | High |
| 4 | Count query (`COUNT`) not re-fetching after insert | Medium |
| 5 | Race condition: optimistic UI update conflicting with async DB write | Medium |

---

## 6. Files to Check

- `src/app/bookmark/page.tsx` — Bookmark panel component
- `src/components/BookmarkPanel.tsx` — Saved cards list rendering
- `src/hooks/useBookmarks.ts` — Bookmark state management
- `src/lib/supabase.ts` — Supabase client and queries
- `src/app/api/bookmarks/route.ts` — Bookmark API route

---

## 7. Recommended Fix

1. **Add console logs** in the toggle function to confirm the API call is being made
2. **Check Supabase dashboard** to see if rows are actually being inserted into the `bookmarks` table
3. **Verify the COUNT query** re-fetches after each insert (ensure `refetch()` is called)
4. **Check browser DevTools** → Network tab for the POST request status

---

## 8. Steps to Reproduce

1. Open the study app: http://210.131.219.61:4000
2. Go to a test/quiz section
3. Toggle the save/bookmark switch on a new card
4. Observe the Bookmark panel — count stays the same

---

## 9. Note

The app is an **IT Passport exam study tool** built for Khant's vocational school studies. It uses:
- **Frontend:** Next.js 14
- **Backend:** Supabase (PostgreSQL)
- **AI:** Cohere (free LLM) for generating explanations
- **Host:** VPS at 210.131.219.61:4000
