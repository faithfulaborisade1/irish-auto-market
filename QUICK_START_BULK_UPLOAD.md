# Quick Start: Bulk Upload Cars with Image URLs

## 🚀 Upload 50 Cars in 3 Hours Instead of 12 Hours!

---

## Step-by-Step Guide (5 Minutes to Learn)

### 1. Download Template
- Go to: **Admin → Cars → Add Cars → Bulk Upload**
- Click: **"Download Simple Template"**

### 2. Fill CSV (The Fast Way)

Open CSV in Excel/Google Sheets:

| title | make | model | year | price | county | description | image_urls |
|-------|------|-------|------|-------|--------|-------------|------------|
| 2020 BMW 320i | BMW | 320i | 2020 | 25000 | Dublin | Great car | URL1\|URL2\|URL3 |

### 3. Get Image URLs (30 Seconds Per Car)

**On DoneDeal/Cars.ie:**
1. Right-click first image → **"Copy Image Address"**
2. Paste into Excel (image_urls column)
3. Add `|` and repeat for more images
4. Result: `https://site.com/1.jpg|https://site.com/2.jpg|https://site.com/3.jpg`

### 4. Upload
- Select dealer
- Upload CSV
- Click "Upload X Cars"
- ✅ Done! System downloads images automatically

---

## Pro Tips

### Getting URLs Super Fast
**Use Keyboard Shortcuts:**
- Right-click image → `E` (Copy Image Address)
- `Ctrl+V` in Excel
- Type `|`
- Repeat

### Copy Multiple Images at Once
1. Open browser DevTools (F12)
2. Network tab → Filter: Images
3. Refresh page
4. Right-click image requests → Copy URLs
5. Paste all at once, add `|` between

---

## Minimum Required Fields

Only **8 fields** needed:
1. `title` - "2020 BMW 320i"
2. `make` - BMW
3. `model` - 320i
4. `year` - 2020
5. `price` - 25000
6. `county` - Dublin
7. `description` - "Great car in excellent condition"
8. `image_urls` - "url1|url2|url3"

**Everything else auto-filled with smart defaults!**

---

## Example CSV

```csv
title,make,model,year,price,county,description,image_urls
"2020 BMW 320i",BMW,320i,2020,25000,Dublin,"Excellent condition","https://img.donedeal.ie/123/1.jpg|https://img.donedeal.ie/123/2.jpg"
"2019 Toyota Corolla",Toyota,Corolla,2019,18000,Cork,"Low mileage hybrid","https://img.donedeal.ie/456/1.jpg|https://img.donedeal.ie/456/2.jpg"
"2021 VW Golf",Volkswagen,Golf,2021,22000,Galway,"Like new","https://img.donedeal.ie/789/1.jpg|https://img.donedeal.ie/789/2.jpg"
```

---

## Time Comparison

### Upload 20 Cars

**Old Method:**
- Download images: 2-3 min per car = **40-60 min**
- Fill form: 5 min per car = **100 min**
- Upload manually: 3 min per car = **60 min**
- **Total: 3-4 hours**

**New Method:**
- Copy image URLs: 30 sec per car = **10 min**
- Fill CSV row: 2 min per car = **40 min**
- Upload CSV: **1 min**
- **Total: 51 minutes** (75% faster!)

---

## Common Issues

### "Image download failed"
→ URL might be temporary. Try opening in browser first.

### "Validation failed"
→ Check required fields are filled.

### CSV won't parse
→ Download fresh template, copy data over.

---

## Need Help?

See full guide: `BULK_UPLOAD_GUIDE.md`
