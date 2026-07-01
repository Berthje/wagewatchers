# WageWatchers — Feature & Data-Model Evolution (Opus working prompt)

## Role & objective

You are working on **WageWatchers**, a tool for anonymously registering salary/compensation data with a rich set of properties. It currently supports **Belgium only**, but the explicit goal is to **expand Europe-wide** (Netherlands, Germany, France next) and potentially the USA/remote later.

Your job: take the user feedback below (collected from real users via a Kanban board) and turn it into a concrete, well-architected proposal — **data model changes (Drizzle ORM), form/UX changes, and analytics features** — that we can implement incrementally.

## Hard constraints (read first — do not violate)

- **No data migration.** We will **not** migrate the existing ~1,900 production entries to any new structure. Old entries stay as-is on the old structure; **everything added from now on follows the new structure.** Design for coexistence of old + new records, not a rewrite.
- **Production data is live (~1,900 entries).** Don't do anything destructive or "weird." Additive, backward-compatible schema changes only. Prefer nullable columns / new tables over altering or dropping existing ones.
- **Stack:** Drizzle ORM. Follow existing project conventions.
- **Scalability is a first-class requirement.** Belgium is just the first country. The data model and forms **must scale cleanly to other countries** (NL, DE, FR, US, remote, …), each of which has different salary norms, benefits, tax concepts, and legal structures. Country-specific fields/benefits should not require schema rewrites — design for country-aware extensibility (e.g. shared core + country-specific extensions / typed config).

## How to approach this

1. First, **propose the data model** (Drizzle schema changes) and how old vs. new records coexist. Surface trade-offs.
2. Then **map each feedback item** to schema + form/UX + analytics impact.
3. Call out anything that needs a product decision before building.
4. Don't start large implementation before the model is agreed.

---

## Feedback, grouped by theme

> Note: items below are verbatim user feedback (possibly with duplicates/overlap) plus grouping. Preserve the intent of each.

### 1. Worker type & employment classification (biggest structural theme)

Right now the tool assumes a salaried (white-collar) worker with a monthly/annual gross salary. Users are asking for fundamentally different compensation models to be first-class:

- **Freelancers** — heavily requested. This is *entirely different* from a salary. The tool is currently focused on people with salaries. Freelancer support should include:
  - **Day rates** (daily rates for freelancers).
  - **Cuts from agencies / middlemen** — ability to add the **% cut of the middleman** and the **total budget given by the client** (so you can see the day rate vs. what the client actually pays vs. what the agency keeps).
- **Blue-collar workers** — don't have a salary but an **hourly rate**, and their compensation depends on entirely different factors than white-collar. Please suggest the right changes for this group too.
- **White-collar workers** — the current salary model.
- → Net effect requested: **support freelancers, blue-collar, and white-collar** as distinct compensation models.
- **Interns / non-permanent jobs** — allow users to enter the **duration of their specific contract / job**. This puts into context how many months you're expected to work with the given benefits.
- **PhD researchers** — often **not paid a salary but a bursary**. In effect they have **no actual gross wage** (except in some cases a "sociale bijdrage"). The university/research institute has a **"virtual gross wage"** used to calculate the bursary, but it doesn't show on the payslip. Need a way to capture this bursary / virtual-gross concept.

### 2. Compensation structure & full salary package

Users want the **whole package** captured, not just a single gross number, and clearer semantics:

- **Gross vs. net:** be sure entries clearly report whether the salary is **gross, net, or both — it should always be clarified.** (Called out as a thing they hate about Glassdoor-style ambiguity.)
- **Fixed vs. variable split:** some sectors (sales, marketing) are heavily **bonus-dependent**. There should be an option to capture the **fixed part of the gross** separately from the **variable part** of the salary.
- **Company car as a structured option** (instead of free-text in a notes box). A lot of people have a company car, so this is valuable info to standardize. Include the **car type: big / small / average (medium)**.
  - Sub-request: add a **column and a filter** for whether the package **includes a car**, because it's a major factor when comparing packages. Right now people are comparing car vs. non-car packages and it's very messed up.
- **Full benefits list to capture** (structured, ideally selectable):
  - **stocks / equity / warrants / RSUs / stock options** — note: this is **not** US-specific. Many users in **Belgium and other countries** also receive stocks/equity, so equity must be a **cross-country** benefit (with vesting schedule where relevant), not gated to the USA.
  - meal vouchers
  - hospitalization insurance, dental insurance, ambulatory insurance, salary-loss (guaranteed income) insurance
  - phone, laptop
  - fuel card, company car (incl. type: big / small / average)
  - bonus, 13th month salary
  - salary increase frequency
  - retirement plan
  - homework / homeworking extra fee
  - WIFI paid by employer
  - an **"other"** free-text field for anything missed.
  - (User: "I truly miss this using Glassdoor!")

### 3. Education / degree

- Let people **choose their specific degree from a list** (structured, not free text). This lets people see how competitive their wage is **for their degree** — especially important in the first **0–5 years** of a career, when degree matters most.
- Right now everything is thrown together with no oversight of who studied what. E.g. you'd expect a **software engineering (burgerlijk / civil engineer)** to earn more in year one than a **software engineering technology (industrieel / industrial engineer)** — but none of that is currently visible.
- A major pain on the old site: **no way to filter by degree.** One person writes "electrical engineering," another "burgerlijk ingenieur elektrotechniek," another "engineering," another just "master." A **canonical, filterable degree list** is wanted so you can see exactly what to expect from your degree.

### 4. Analytics / benchmarking ("how do I compare?")

- **"My position vs. my peers."** Users want **in-app feedback / reports / statistics** they can filter by: **age, experience, sector, diploma** (and combinations). Core question: *Am I actually paid "markt-conform" / competitive, as HR promised? How are others my age / experience / diploma doing in the same sector? In other sectors?*
- This is cited as the reason **r/BESalary** is so popular. Consider possibly a separate function for it — e.g. a **"simulation tool"** as an extra.

### 5. Location & geography (ties into multi-country scaling)

- **Selectable unit of measure for home↔work distance** (km **or** minutes).
- **Variable geographic granularity.** Support a **higher scope than city**: let users choose how precise they want to be — **country → province → city.** If they don't want to share their city, they can share just the province (or country).
- **Grenswerkers / cross-border workers** — "Mogelijk interessant om gegevens van grenswerkers toe te voegen?" → Is it possible to add cross-border worker data? (Someone living in one country and working in another — relevant for the BE/NL/DE/FR expansion and tax/net differences.)

### 6. Data correctness & editing

- **Let users edit their entries.** "I've made a mistake in some entries — can I adjust them to better reflect reality?" Suggested: give a **grace period** during which edits are allowed; after that, locked. **Make the grace period / locking rules clearer** to users.

### 7. Bugs

- **Graph bug — "Salary Distribution by Experience."** The chart seems off (at least on phone — unsure about desktop): the values in the orange "stick" (whisker/bar) graph **don't match the median and the salary values**. Needs investigating/fixing.

---

## Additional benefits to consider (suggested — please add what's logical per country)

Beyond the user's list, consider adding these as structured, country-aware benefit options where they make sense:

- **Belgium 🇧🇪:** eco-vouchers (ecocheques), **cafeteria plan**, group insurance / pension (groepsverzekering), **bike lease / company bicycle** (very common), **mobility budget**, net expense allowances (onkostenvergoeding), homeworking allowance, GSM/internet subscription, **IP/copyright remuneration (auteursrechten)** — common in IT, number of holiday/ADV days.
- **Netherlands 🇳🇱:** mandatory **8% holiday allowance (vakantiegeld)**, **30%-ruling** (expat tax benefit), pension scheme (pensioenregeling), lease car, travel allowance (reiskostenvergoeding), home-work allowance (thuiswerkvergoeding), 13th month / end-of-year bonus.
- **France 🇫🇷:** **13th month**, tickets restaurant, **mutuelle** (health insurance), **participation / intéressement** (profit sharing), **RTT** days, mandatory 50% transport reimbursement, CSE/works-council benefits, prime.
- **Germany 🇩🇪:** 13th month / Weihnachtsgeld, Urlaubsgeld (holiday bonus), **VWL** (vermögenswirksame Leistungen / capital-forming benefits), Jobticket / Deutschlandticket, company pension (betriebliche Altersvorsorge), JobRad (bike lease), number of vacation days.
- **USA 🇺🇸:** **401(k) match**, health/dental/vision insurance, PTO days, sign-on bonus, HSA/FSA. (Note: **equity / RSUs / stock options are cross-country**, not US-only — see the benefits list above.)
- **Remote / general:** home-office stipend, coworking allowance, internet/phone reimbursement, **equipment / hardware budget**, equity vesting schedule, profit sharing, number of paid leave days.

---

## Deliverable

A proposal covering:
1. **Drizzle schema design** — new tables/columns, how old (~1,900) and new records coexist with **no migration**, and how it scales per-country without rewrites.
2. **Per-feedback mapping** — each item above → schema + form/UX + analytics changes.
3. **Open product decisions** that need an answer before building.
4. A suggested **incremental rollout order** (what to ship first).
