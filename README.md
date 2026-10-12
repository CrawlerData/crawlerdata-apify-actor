## Google Shopping & SERP Scraper

Get **Google Shopping products, every seller's price, product details** and **Google Search, Images, News, Local and Autocomplete** results as clean, structured JSON, without running browsers, proxies or parsers yourself.

This Actor runs on the [CrawlerData API](https://crawlerdata.com), a Google Shopping and SERP data API built for production price monitoring.

### What you can scrape

| Option | Input | You get |
|---|---|---|
| Google Shopping: search products | search queries | products with title, price, old price, merchant, rating, reviews, delivery, thumbnail and `product_id` |
| Google Shopping: sellers & prices | product IDs | every seller's offer: merchant, price, shipping, total price, availability, link |
| Google Shopping: product details | product IDs | title, brand, description, features, specs, images, rating, reviews, price |
| Google Search | search queries | organic results, ads, AI overview, People also ask, local pack, top stories, knowledge panel, related searches; desktop or mobile |
| Google Images | search queries | title, source page, original image URL, size, thumbnail |
| Google News | search queries | title, source, date, snippet, thumbnail, link |
| Google Local | search queries | business name, rating, reviews, category, address, phone, hours, website |
| Google Autocomplete | partial queries | search suggestions |

31 countries and any language. Each query or product ID becomes one row in the dataset.

### How to use it

1. Pick **What to scrape**.
2. Add **search queries**, or **product IDs** for the sellers and product-details options. Run a Google Shopping search first to get product IDs (`product_id` in each result).
3. Set the **country** (e.g. `us`, `gb`, `de`) and **language** (e.g. `en`).
4. Run. Results appear in the dataset; export them as JSON, CSV or Excel, or read them through the Apify API.

### Output example (Google Shopping search)

```json
{
  "input": "wireless headphones",
  "endpoint": "google-shopping-search",
  "country": "us",
  "status": "completed",
  "credits": 1,
  "error": null,
  "result": {
    "shopping_results": [
      { "position": 1, "product_id": "14580532573920022357", "title": "Soundplay Foldable Wireless Headphones Bluetooth Over-Ear Headset with Built-in Mic", "price": { "value": 14.94, "currency": "USD", "raw": "$14.94" }, "merchant": "Walmart", "rating": 4.6, "reviews": 866 }
    ]
  }
}
```

### Pricing

Pay per event: you pay per **credit**.

- Most requests cost 1 credit.
- Google Shopping sellers costs 1 credit per 10 sellers returned, rounded up (a product with 22 sellers is 3 credits).
- **Failed requests are free.**

Set a maximum cost per run in Apify and the Actor stops when it is reached.

### Tips

- **Price monitoring:** store the `product_id`s you care about and run "sellers & prices" on a schedule. You skip the search step, so each check is a single request.
- **High volume or webhooks:** use the [CrawlerData API](https://crawlerdata.com) directly for async queues, webhooks and volume pricing.

### Support

Questions or a missing field? Open an issue on this Actor or email contact@crawlerdata.com.
