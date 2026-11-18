# Hackathon Hunter

Find upcoming hackathons, track the ones you care about, and don't miss deadlines.
Listings come live from **Devpost**, **MLH**, **Cerebral Valley**, **lablab.ai**, **Devfolio**, **DoraHacks**, **Hack Club**, **Luma**, **NASA Space Apps** and **Google Developer Groups**, with hackathons and tech events in **Myanmar** pinned at the top. They're re-scraped every day and refreshed every 30 minutes while people visit.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

For production: `npm run build && npm start`.

## Features

- **Browse & filter**: search with several words at once ("ai yangon") across names, organizers, sponsors, themes, places, sources and companies; filter by format (online / in person / hybrid), location, source, minimum prize, start-date range, theme chips, registration status, beginner friendly, big tech companies, "closing within 7 days" and **New** (listed since your last visit, badged for two days). Sort by deadline, prize, registrations or start date. Filters are kept in the URL, so you can bookmark or share a view. "Updated … · N sources" above the grid shows how many listings each source gave and which are down.
- **A page for every hackathon** (`/h/<source>/<id>`): exact times in Yangon time and your own time zone, a timeline (applications close → starts → ends), prizes, themes, sponsors, a description when the source has one, Reddit posts that mention it, "find teammates" searches, similar hackathons, Google Calendar buttons, and sharing to Telegram, Viber, Facebook, WhatsApp, X and LinkedIn. Shared links get a generated preview image (`opengraph-image.tsx`). Cards open this page; their ↗ icon opens the original site.
- **Subscribe to any view**: the **Subscribe** button gives a calendar link (Google, Apple, Outlook), an RSS feed and a JSON link for the current filters, or for your saved list. Calendar apps re-check it every few hours, so new hackathons and changed deadlines show up by themselves, with reminders a day and 2 hours before each deadline.
- **Big tech**: hackathons run or sponsored by companies like Google, Meta, Microsoft, Amazon, NVIDIA, OpenAI and Anthropic get a company badge. Use the **Big tech** toggle for all of them, or the company chips for specific ones (e.g. `/?co=Meta`). Detection is name-based (`lib/companies.ts`) and also recognizes products, so a Gemini hackathon counts as Google's. Local chapters like Google Developer Groups or AWS student clubs don't count.
- **Bookmarks & tracking**: star any hackathon, then move it through *interested → registered → building → submitted* on the **Saved** board (drag cards between columns or change their status). The ✎ button holds notes, your team, a repo/demo link, a personal "remind me at" time and the result. Finished hackathons move to **Past hackathons**, where you record whether you won, made the finals or took part; stats at the top count saved, registered, submitted and wins. **Send to phone** makes a link that carries the whole list (compressed into the link's `#fragment`, which never reaches the server) and offers to import it on the other device. Export or import JSON from Saved or **Settings**; **Help** answers common questions.
- **Deadline reminders**: countdown badges on every card (amber under 7 days, red under 48h), a banner for saved hackathons closing within 72 hours and for your own reminders, optional browser notifications (a day before a deadline and when a reminder is due), and a **+ Calendar** button that downloads an `.ics` event with a reminder the day before.
- **Installable app**: a web app manifest and a service worker (`public/sw.js`, production only) let you install it on Android, iPhone or desktop. Pages and listings you've opened work offline; the install button appears in the nav bar and Settings when the browser offers it.

- **Social**: the latest posts from r/hackathon and r/hackathons, sorted into *Announcements*, *Looking for team* and *Discussion*. Posts that name a listed hackathon are linked to it, and its card shows a 💬 count, which is handy for finding teammates.
- **LinkedIn & Facebook**: neither offers a public way to read posts, so the Social page has buttons that open their own search. If you find a hackathon there, use **Add from link** on the Saved page: paste the post's text and the name, deadline, dates, place, format and USD prize are filled in (`lib/postParse.ts`; English and Burmese dates and digits both work).
- **Facebook**: the app never logs into Facebook (that breaks Meta's terms and gets accounts disabled, and Facebook blocks servers anyway). Instead:
  - **Pages you follow, automatically**: make a feed link for each public page with a feed service such as [rss.app](https://rss.app) or [FetchRSS](https://fetchrss.com), and put the links in the `FACEBOOK_FEEDS` environment variable (separated by commas or spaces). `lib/sources/facebook.ts` reads them (RSS, Atom or JSON Feed), keeps posts that read like a hackathon or competition, posted in the last 60 days and not already over, and lists them as Myanmar events, so they also reach the Telegram alerts. Feed links can also go in `FEEDS_IN_CODE` in that file.
  - **One post at a time**: on Android, install the app and share a post to it (Facebook → Share → Hackathon Hunter; the manifest's `share_target` opens Saved with it filled in). On a computer, drag the **＋ Hackathon Hunter** button in Settings to your bookmarks bar and click it on a post with its text selected. Or forward the post to the Telegram bot, which replies with what it found and a one-tap save link.

Bookmarks are stored in your browser's `localStorage`. They aren't synced between browsers, so use Export/Import to move them.

## How the data works

| Source  | How it's fetched | "Deadline" means |
|---------|------------------|------------------|
| Devpost | Public JSON API (`devpost.com/api/hackathons`) | End of the submission period (Devpost gives no time, so it's taken as 23:59 UTC) |
| MLH     | Event data embedded in the season page (`mlh.com/seasons/<year>/events`) | Event start time |
| Cerebral Valley | Public API behind `cerebralvalley.ai/events` (`api.cerebralvalley.ai/v1/public/event/pull`), paged through for every upcoming event typed as a hackathon. Hosts become the organizer, so the sponsoring company (Google DeepMind, Meta, OpenAI, Anthropic…) is named; prizes are read from the summary ("$1 million in prizes") | Event start time |
| lablab.ai | Event list embedded in `lablab.ai/ai-hackathons` (sponsor-run AI hackathons, e.g. AMD) | Event start time |
| Devfolio | Public search API behind `devfolio.co/hackathons` (`api.devfolio.co/api/search/hackathons`, the *open* and *upcoming* tabs). Mostly India and Asia (e.g. ETHChiangmai). Sponsors are kept, so a "Google Gemini" sponsor makes it a Google hackathon | Applications close (falls back to the start time) |
| DoraHacks | Public hub API behind `dorahacks.io/hackathon` (`/api/v1/hub/hackathons`). Live hackathons come first, so it pages until a page is all finished. Prize pools in USD, USDC or USDT count as prizes | End of the submission period |
| Hack Club | Public JSON at `hackathons.hackclub.com/api/events/upcoming` (high school hackathons worldwide) | Event start time |
| Facebook | Feed links you configure in `FACEBOOK_FEEDS` (see above). Dates, place and prize are read from the post's text, so they're a best guess | The deadline the post names (registration, applications or submissions), otherwise the start |
| Luma    | Public discover search for "hackathon". Results favor events near wherever the app runs, so Myanmar gets its own searches ("Myanmar", "Yangon", "Cursor Myanmar"…) plus the Myanmar community calendars (e.g. Cursor & Grok Myanmar). Every Myanmar event is kept, meetups and workshops included, judged by venue country, the Asia/Yangon time zone or a Myanmar-based calendar | Event start time |
| Google Developer Groups | Public JSON on `gdg.community.dev`: upcoming events of every GDG chapter in Myanmar (DevFest Yangon, I/O Extended…) | Event start time |
| NASA Space Apps | Public GraphQL API behind `spaceappschallenge.org`. Lists each upcoming challenge once (worldwide, with local event and registration counts) plus its local events in Myanmar | Event start time |
| Local picks | Hand-written list in `lib/sources/curated.ts` for Myanmar events no site lists (e.g. the YTU Science Festival). Dates can be left empty ("Dates TBA"); each entry hides itself after its `hideAfter` date | Event start time |

| Reddit  | Atom feed of r/hackathon + r/hackathons (Reddit blocks anonymous JSON). Posts are classified by keyword rules in `lib/sources/reddit.ts` | — |

Reddit rate-limits hard, so it's fetched in a single request and cached for 30 minutes. If it fails, the Social page shows the error and the rest of the app is unaffected.

**Refresh schedule:** pages are re-scraped at most every 30 minutes when someone visits. On Vercel, a daily cron job (`vercel.json`, 00:00 UTC) also calls `GET /api/cron/refresh`, which clears the cache and re-scrapes everything even if nobody has visited. That route needs the `CRON_SECRET` environment variable; Vercel sends it automatically, and any other caller gets a 401.

**Telegram alerts:** the same daily job sends a Telegram message for every new Myanmar event from any source (6:30 AM Yangon time), with a link to its page here, and keeps a pinned message in the chat listing the upcoming ones (each title links to the event). The pinned list is how it remembers what it already announced, so leave it pinned. When it first runs after upgrading from the Luma-only version, events from the other sources are added to the list quietly instead of being announced all at once. To turn it on:

1. Create a bot with [@BotFather](https://t.me/BotFather) and send your new bot any message.
2. Find your chat id at `https://api.telegram.org/bot<token>/getUpdates` (`message.chat.id`).
3. In Vercel, add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and `CRON_SECRET` (any long random string), then redeploy.

The bot also answers commands (send `/help` once and they appear in Telegram's `/` menu):

| Command | What it sends |
|---------|---------------|
| `/myanmar` | Upcoming events in Myanmar |
| `/closing` | Deadlines in the next 3 days (`/closing 7` for a week) |
| `/bigtech` | Hackathons run or sponsored by big tech, still open |
| `/top` | Biggest prizes still open |
| `/online` | Online hackathons you can still join |
| `/search ai agents` | Search, same as the Browse page's search box |
| `/scrape` | Scrape every source now and list the Myanmar events (`/scrape luma`, `/scrape devfolio`… for one source); new ones are announced too |
| `/stats` | Listings per source, and which sources are down |
| *(any post)* | Forward or paste a hackathon post: the bot replies with its name, deadline, dates and place, a one-tap "save it" link and a Google Calendar link |

For that, add `TELEGRAM_WEBHOOK_SECRET` (any random string) to Vercel and point the bot at the app once: `https://api.telegram.org/bot<token>/setWebhook?url=https://<your-domain>/api/telegram&secret_token=<secret>`. Only the chat in `TELEGRAM_CHAT_ID` gets answers.

Links in feeds, the bot and share text use `APP_URL` if you set it (e.g. a custom domain), otherwise Vercel's production URL.

### Feeds and API

Every endpoint takes the same filter parameters as the Browse page's URL (`mm=1`, `mode=online`, `bigtech=1`, `co=Google`, `closing=1`, `q=ai`, `source=devfolio`, `minPrize=1000`…), or `ids=<id>,<id>` for a list of saved hackathons:

- `GET /api/hackathons` returns the merged list as JSON (`limit=N` to shorten it; CORS is open). Without parameters it's everything, as before.
- `GET /api/calendar` returns an iCalendar feed to subscribe to.
- `GET /feed.xml` returns RSS 2.0.
- `GET /api/social` returns the classified Reddit posts.

If one source fails, the others still load and the UI says which one is down.
Duplicates (same title on both sites) keep the Devpost version because it carries prize and registration data.

## Code map

- `lib/sources/` — one fetcher per site, each normalizing into the `Hackathon` type in `lib/types.ts`; `lib/sources/meta.ts` names every source in one place
- `lib/aggregate.ts` — merges, dedupes, drops ended events, sorts, counts per source
- `lib/social.ts` — loads Reddit posts and links them to hackathons they mention
- `lib/filters.ts` — filter/sort logic and URL (de)serialization; `lib/select.ts` applies the same filters to feeds and the API
- `lib/feeds.ts` — iCalendar and RSS builders; `lib/when.ts` — time zone-safe date formatting and Google Calendar links
- `lib/useTracker.ts` — bookmark storage hook (notes, reminders, results); `lib/sync.ts` — "Send to phone" links; `lib/useSeen.ts` — "New" badges
- `lib/alerts.ts` and `app/api/telegram/route.ts` — the Telegram bot
- `app/h/[source]/[id]/` — a hackathon's page and its preview image
- `app/manifest.ts`, `app/pwa-icon/`, `public/sw.js`, `components/Pwa.tsx` — the installable app
- `components/` — UI
