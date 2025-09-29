# Website RG – Content Audit

This document catalogs the user-facing copy, contact details, and external links across the `website-rg` project so you can plan content updates. Text is grouped by shared elements, individual pages, and dynamic data sources. References include the source file for quick editing.

---

## Global Shared UI

| Location                                      | Text / Value                                                                                     | Notes                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Header brand (`frontend/*.html`)              | `RG-FIDES`                                                                                  | Appears as the site title in top navigation on every page.                                     |
| Navigation links (`frontend/*.html`)          | `Home`, `Projects`, `Team`, `Dashboard`, `Admin panel`, `Register`, `Login`, `Contact Us`, `Logout` | `Dashboard`, `Admin`, and `Logout` links are hidden until the user is authenticated.           |
| Favicon (`frontend/*.html`)                   | `images/rg-favicon.svg`                                                                          | Update the SVG file or link to change.                                                         |
| Footer text (`frontend/*.html`)               | `© {year} RG-FIDES`                                                                         | `{year}` is populated dynamically by JavaScript.                                               |
| Footer external link (`frontend/*.html`)      | URL: `https://github.com/oleksandkov/oleksandkov-maded`<br/>Label: `GitHub`                      | Link opens in a new tab with accessible label "Open the Small Company GitHub repository".      |
| Notification modal toggle (`frontend/app.js`) | "Enable content alerts" (button label)                                                           | Modal markup lives in `frontend/partials/notification-modal.html` and is injected when needed. |

---

## Home (`frontend/index.html`)

### Hero

- Heading: `RG-FIDES`
- Subheading: `We are the agency that create an unique products coopereted with the latest AI modals`
- Primary CTA button: `Check products`
- Secondary CTA button: `Meet the team`

### Welcome Section

- Heading: `Hi there,`
- Body copy: `Welcome to our private website, here you can meet our team, see our projects and view our works where you can find useful courses, articles and much more information`
- Buttons: `Explore projects`, `Meet our team`

#### Highlights

1. **Curated playbooks** – `Reusable templates, guides, and tooling to accelerate delivery.`
2. **Transparent workflow** – `Follow our pipeline from idea to launch with clear milestones.`
3. **Community support** – `Office hours, workshops, and mentorship designed for real teams.`

### "What we can do" Section

- Intro: `From planning to launch, we help teams ship polished digital experiences. Explore a few ways we partner with organizations.`
- Capability cards:
  - **Insightful Dashboards** – `We turn complex datasets into clear stories with interactive dashboards, automated reports, and stakeholder-ready visuals.`
    - Bullets: `Analytics audits and data modeling`, `Interactive dashboards in modern BI tools`, `Training sessions for internal teams`
  - **Rapid Prototyping** – `Designers and engineers co-create clickable prototypes, proof of concepts, and MVPs that gather feedback fast.`
    - Bullets: `User journey mapping and UX flows`, `Accessible component libraries`, `Deployment-ready starter kits`
  - **Automation & Enablement** – `We streamline workflows with secure integrations, notification systems, and knowledge resources your teams can own.`
    - Bullets: `Custom middleware and API wiring`, `Alerting, logging, and operations playbooks`, `Onboarding guides and enablement training`

### About Us

- Intro paragraph: `We are a multidisciplinary team of builders, analysts, and mentors who love turning bold ideas into polished experiences. From the first brainstorming sketch to the final deployment, we stay curious, share knowledge generously, and keep people at the center of every decision.`
- Cards:
  - **Mission** – `Empower learners and partners with practical tools, transparent processes, and mentorship that sparks long-term growth.`
  - **Culture** – `We foster open collaboration and celebrate diverse voices. Weekly stand-ups keep everyone aligned, while demo days showcase wins and lessons learned.`
  - **Focus** – `Our projects span data storytelling, web engineering, and community education. Each initiative blends research, design, and hands-on experimentation.`
- Highlights:
  - `Weekly Learning Labs` – `Interactive sessions where teammates workshop new tech, build prototypes, and give live feedback.`
  - `Open Resource Library` – `Curated templates, starter kits, and playbooks maintained by the group to help newcomers ramp up quickly.`
  - `Mentorship Network` – `A rotating roster of mentors pairs with members to set goals, review progress, and unlock new opportunities.`

### Portfolio Previews

- Section heading: `Public View`
- Description: `Explore our open portfolio and meet the people behind the work. The Members area highlights detailed bios, focus areas, and contact points for every core team lead.`
- Button: `Meet the team`
- Placeholder headings (no static copy shown): `Latest Projects`, `Members`, `Documents`

### Contact Teaser

- Badge: `Stay Connected`
- Heading: `Contact Us`
- Intro: `Have a question, collaboration idea, or press inquiry? Reach out to the right channel and our team will follow up within one business day.`
- Cards:
  - **Email** – `General inquiries, partnerships, and speaking invitations.`<br/>Link: `mailto:hello@smallcompany.org`
  - **GitHub** – `Explore our repositories, contribute code, and follow project updates.`<br/>Link: `https://github.com/smallcompany`
  - **LinkedIn** – `Connect with the team, stay informed about events, and grow together.`<br/>Link: `https://linkedin.com/company/smallcompany`
- CTA button: `Start a Conversation`

---

## Projects (`frontend/projects.html`)

- Hero heading: `RG-FIDES Project Library`
- Subheading: `Explore the launches, data tooling, and creative experiments we ship with our partners to move metrics and tell stories.`
- Section heading: `Projects`
- Description: `Browse our latest releases and in-progress experiments. Each card highlights the tools we used, who led the work, and where you can dig into the source code or live demos.`

---

## Members (`frontend/members.html`)

- Hero subheading: `Public insight into the people shaping our products and culture.`
- Section heading: `Public View`
- Description: `Discover the leaders behind Small Company. This page provides a public-friendly snapshot of each team member, their focus areas, and open contact channels so partners can easily reach the right expert.`
- `Team Highlights` lead paragraph: `A quick glance at the strengths and voices that make us who we are.`
- `Detailed Profiles` heading (content populated dynamically).

---

## Contact (`frontend/contact.html`)

### Hero

- Heading: `We'd love to hear from you`
- Subheading: `Share your ideas, request a collaboration, or ask the crew a question. We'll follow up within one business day.`

### Contact Form

- Badge: `Reach the team`
- Heading: `Write us a message`
- Instruction: `Use the form below to draft your email. When you hit send, your preferred email app will open with all the details ready to go to hello@smallcompany.org.`
- Field labels & placeholders:
  - `Your Name` – placeholder `Jane Doe`
  - `Your Email` – placeholder `you@example.com`
  - `Subject` – placeholder `Let's collaborate`
  - `Message` – placeholder `Share a short outline of your idea or question...`
- Submit button: `Send Email`

### Direct Channels

- Badge: `Direct channels`
- Heading: `Prefer another route?`
- Cards:
  - **GitHub** – `Open issues, share improvements, and track our releases.`<br/>Link: `https://github.com/smallcompany`
  - **LinkedIn** – `Connect with us professionally and follow team announcements.`<br/>Link: `https://linkedin.com/company/smallcompany`
  - **Phone** – `Need to talk live? Call us Monday–Friday, 10:00–17:00 (EET).`<br/>Number: `+380 (44) 123-45-67`

### Form Notification Messages (`frontend/contact.html` script)

- Success: `Thanks! Your note is on its way to our inbox.`
- Missing fields: `Please include both a subject and a message before sending.`
- Email unavailable: `We couldn't reach the mail service right now. Please try again soon.`
- Generic failure: `We couldn't send your message. Please retry in a moment.` / `We hit an unexpected error while sending your message.`
- Button loading label: `Sending…`

---

## Login (`frontend/login.html`)

- Badge: `Welcome back`
- Heading: `Login`
- Subtitle: `Sign in to keep momentum on your projects and documents.`
- Labels: `Email`, `Password`
- Submit button text: `Login`
- Error placeholder text: `New here? Create a guest account.` (link label)
- Aside badge: `Team portal`
- Aside heading: `Keep your initiatives energized`
- Aside paragraph: `Access the internal dashboard, publish new case studies, and stay in sync with the crew wherever you’re working from.`
- Feature bullets:
  - `Lightning launches` – `Spin up fresh project showcases with streamlined templates.`
  - `Secure access` – `Keep sensitive briefs and documents in a protected workspace.`
  - `Aligned teams` – `Collaborate with members, capture updates, and celebrate wins.`
- Stats: `120+ Projects shipped`, `24/7 Global access`

---

## Register (`frontend/register.html`)

- Badge: `Guest access`
- Heading: `Create an account`
- Subtitle: `Join the extended Small Company crew to get curated updates and early previews.`
- Field labels: `First Name`, `Last Name`, `Email`, `Password`, `Confirm Password`
- Submit button: `Create account`
- Success messaging placeholders (hidden by default): `register-success`, `Resend verification email`
- Hint: `Already have an account? Log in here.`
- Aside badge: `Why join?`
- Aside heading: `Be the first to explore what’s next`
- Aside paragraph: `Unlock private previews, early prototypes, and curated updates from our delivery teams.`
- Feature bullets:
  - `Exclusive releases` – `Peek behind the curtain before projects become public.`
  - `Curated insights` – `Receive quarterly roundups and lessons learned from our squads.`
  - `Personalized picks` – `Select topics you care about and get tailored recommendations.`
- Stats: `4.9★ Guest satisfaction`, `2k+ Community members`

---

## Email Verification (`frontend/verify.html`)

- Badge: `Email verification`
- Heading: `Confirming your guest access`
- Subtitle: `We just need to confirm your link. This usually takes only a few moments.`
- Status copy: `Checking your verification token…`
- Actions: `Resend verification email`, `Go to login`, `Back to register`

---

## Admin (`frontend/admin.html`)

### Hero

- Heading: `RG-FIDES Admin Workspace`
- Subtitle: `Publish updates, seed events, and curate the project catalog for everyone relying on the dashboard.`
- Buttons: `Manage content`, `View dashboard`

### Admin Panel Sections & Copy

1. **Create Project**

   - Field placeholders: `Title`, `Description`, `Image URL (optional)`, `GitHub URL (optional)`, `External Link (optional)`
   - File picker text: `Select image`, `No image selected`, hint `Upload a local image (max 5MB).`
   - Team picker hint: `Choose from the Members page roster. Check everyone who contributed to this project.`
   - Submit button: `Create`

2. **Create Event**

   - Placeholders: `Event title`, `Description (optional)`, `Location (optional)`
   - Date picker text: `Select date & time`, `No date selected`, weekday labels `Sun`–`Sat`
   - Time selectors: `Hour`, `Minute`
   - Menu actions: `Now`, `Clear`, `Apply`
   - Duration picker labels: `Duration`, `Select duration`, `Hours`, `Minutes`
   - Hint: `Choose how long the meeting should last. We'll include this in the invite template and emails.`
   - Team picker hint: `Select everyone who should receive this event invitation. We'll generate a ready-to-send template and you can email invites to them directly from the list below.`
   - Submit button: `Create Event`

3. **All Projects / Upcoming Events / Manage Documents / All Documents**
   - Document forms include labels: `Add Document by URL`, `Document Title`, `Document URL`, `Description (optional)`, `Admin Only`, `Select file`, `File Title (optional)`, `File Description (optional)`, `No file selected`, `Upload File`
   - Upload progress text: `Uploading...`
   - Button labels: `Add Document`, `Upload File`

### Notification Containers

- Shared element: `Notification pending` messages are injected via `app.js` (see Dynamic Notifications section below).

---

## Dashboard (`frontend/dashboard.html`)

### Hero

- Heading: `RG-FIDES Control Center`
- Subtitle: `Track launches, manage editorial content, and sync partner handoffs in one real-time workspace.`
- Buttons: `Jump into updates`, `Open admin tools`

### Guest-Facing Sections

- `Latest updates` – `Stay on top of new guest articles and podcast episodes as soon as they publish.`
- `Team Articles` – `Stories, guides, and resources curated by the Small Company crew for visitors and partners.`
- Guest article editor intro: `Only teammates with publishing access can see this editor while previewing the guest dashboard. Updates sync directly to MongoDB.`
- Guest podcast section: `Podcasts` – `Listen to quick interviews and stories recorded by the Small Company crew.`
- Podcast editor intro: `Only teammates with publishing access can see this editor while previewing the guest dashboard. Episodes publish directly to the public page.`

### Admin Sidebar Sections

- `Team Notes` – `Keep the crew aligned on priorities and blockers.`
- `Codespaces` – `Available cloud workspaces for current projects.`
- `Guest Articles` – `Manage the stories guests see on the public dashboard.`
- `Admin Events` – `Upcoming internal gatherings and deadlines.`
- View controls text: `Preview how guests experience the dashboard without leaving admin mode.` / `You're previewing the public dashboard. Turn on editing to manage welcome articles without leaving this view.` / `Turn on editing to manage podcast episodes without leaving this view.`
- Buttons include: `Edit dashboard`, `View as guest`, `Edit guest articles`, `Save article changes`, `Edit guest podcasts`, `Save podcast changes`, `Save changes`

### Form Labels & Hints (selected)

- Articles: `Title`, `Summary`, `Authors` (hint: `Separate multiple author names with commas.`), `Hero image URL` (hint: `Paste a hosted link or upload a local file below.`)
- Article sub-sections: `Featured links`, `Add link`, `Attachments`, `Add attachment`, `Gallery images`, `Add image`, `Audio tracks`, `Add audio`
- Podcasts: `Title`, `Description`, `Audio URL` (hint: `Upload a new MP3 or paste a hosted link.`)
- Notes: `Add task`, `Author` (optional)
- Codespaces: labels for `Project`, `Repository`, `Branch`, `Status`, `Region`, `Launch URL`, `Repository URL`, `Editor`, `Description` with hint `URL will be generated automatically if omitted.`
- Notifications modal text (inline copy repeated in partial): `Enable content alerts`, `Stay in the loop when new guest articles or podcast episodes are published. You can switch this off anytime from the footer toggle.`, `Delivery email`, `We'll send updates to this address when new content goes live.`, `I'm a verified team member (skip guest confirmation)`, buttons `Not now`, `Enable notifications`.

---

## Partial (`frontend/partials/notification-modal.html`)

- Same wording as described above for the notification opt-in modal.

---

## Dynamic Content & Data (`frontend/app.js`)

### Seeded Team Member Profiles

1. **Oleksandr Kovalenko**

   - Role: `Lead Engineer`
   - Review: `Oleksandr brings a calm leadership style and an eye for scalable architecture. He keeps the team moving forward with clarity.`
   - Bio: `Over a decade of experience building resilient cloud platforms for logistics, finance, and civic-tech organizations.`
   - Tenure: `Joined 2018`
   - Focus Areas: `Platform Architecture`, `Security Reviews`, `Tech Mentoring`
   - Location: `Kyiv, Ukraine`
   - Email: `muaronok@gmail.com`
   - LinkedIn: `https://www.linkedin.com/in/oleksandr`

2. **Mariana Danyliuk**

   - Role: `Product Strategist`
   - Review: `Mariana translates customer voices into actionable plans. Her roadmaps balance ambition with realistic delivery timelines.`
   - Bio: `Former startup founder turned product leader focused on inclusive digital experiences for public services.`
   - Tenure: `Joined 2020`
   - Focus Areas: `Vision & Roadmaps`, `Stakeholder Facilitation`, `Impact Reporting`
   - Location: `Lviv, Ukraine`
   - Email: `mariana@smallco.com`
   - LinkedIn: `https://www.linkedin.com/in/mariana`

3. **Taras Hrytsenko**
   - Role: `UX Researcher`
   - Review: `Taras champions empathy in every workshop. The result is a product experience that feels intuitive and genuinely human.`
   - Bio: `Researcher and service designer who has delivered evidence-based UX improvements across healthcare and education platforms.`
   - Tenure: `Joined 2019`
   - Focus Areas: `Field Studies`, `Service Blueprints`, `Accessibility Audits`
   - Location: `Odesa, Ukraine`
   - Email: `taras@smallco.com`
   - LinkedIn: `https://www.linkedin.com/in/taras`

### Key Notification & Status Messages

Use Find (`Ctrl/Cmd + F`) for `showNotification(` within `frontend/app.js` to adjust the following messages:

- `Note removal queued. Click Save changes to apply.`
- `Codespace removal queued. Click Save changes to apply.`
- `Article not found.`
- `Podcast not found.`
- `Template copied to clipboard`
- `Template copied`
- `Add a title before publishing.`
- `Unable to stage this article.`
- `Unable to stage this podcast entry.`
- `Unable to stage this note.`
- `Unable to stage this codespace.`
- `Project deleted successfully!`
- `Project status updated`
- `Event removed`
- `Please choose a date and time`
- `Document added successfully!`
- `Document deleted successfully!`
- `Please select a file first`

Additional notification text (success/failure states, upload errors, email confirmations, etc.) also lives in `app.js`. Review the surrounding code for context-specific strings such as:

- `Notification already sent for this article.` / `Notification sent successfully.`
- `Notification cancelled before sending.`
- `Email not verified. We've just sent you a fresh verification link.`
- `We couldn't send the verification email. Please try again later.`
- `We couldn't reach the mail service right now. Please try again soon.`
- `Project "{title}" created successfully!`
- `Event "{title}" created`
- `Template copied`
- Upload-related: `Image upload failed`, `Upload Failed`, `Please choose a date and time`, `Unable to stage this article/podcast/note/codespace.`

### Local Storage Keys / Labels (for reference)

- Notification toggle button labels: `Notifications On`, `Notifications Off` with icons `🔔` / `🔕`.
- Modal confirmation button states: `Enabling…`, `Saving…`, `Saving…` (dashboard save button shows `Saving…` while busy).

---

## Backend Responses (Selected)

User-facing API responses originate in Express routes and may surface in the UI. Update the strings in `website-rg/backend/routes/*.js` if needed.

- **Authentication (`routes/auth.js`)**

  - Errors: `Email and password required`, `User already exists`, `Invalid credentials`, `Email not verified. Please check your inbox for the verification link.`, `Email not verified. We've just sent you a fresh verification link.`, `Email verification is currently unavailable. Please contact the site administrator.`, `We couldn't send the verification email. Please try again later.`, `Email delivery is not configured right now.`, `You can request another verification email in about {waitLabel}.`
  - Success messages: `Email verified successfully. You can now log in.`, `We've sent a fresh verification email.`, `This account is already verified. You can log in now.`
  - Subject line template: `Confirm your Small Company guest account` (email verification).

- **Contact (`routes/contact.js`)**

  - Errors: `Email service is not configured. Set SMTP credentials to enable contact form notifications.`, `Subject is required`, `Message is required`, `A valid email address is required`, `No contact recipients configured. Set CONTACT_FORM_RECIPIENTS or CONTACT_EMAIL in the environment.`, `Failed to send contact email`.
  - Email subject prefix: `Website contact:`
  - Email body intro: `New contact form submission received.`

- **Projects (`routes/projects.js`)**

  - Validation: `Missing token`, `Invalid token`, `Admin only`, `Title required`, `Image upload failed`, `No image uploaded`, `Invalid image type. Allowed: PNG, JPG, JPEG, GIF, WEBP`, `Not found`, `Database error`, `Image uploaded successfully`.

- **Documents / Dashboard / Events / Media**
  - Similar phrasing for `Database error`, `Missing token`, `Invalid token`, `Admin only`, `Upload failed`, etc. Check each route for precise wording if you need edits.

---

## Contact Information Summary

| Type               | Value                                                            | Source                                         |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------- |
| General email      | `hello@smallcompany.org`                                         | `frontend/index.html`, `frontend/contact.html` |
| Team member emails | `muaronok@gmail.com`, `mariana@smallco.com`, `taras@smallco.com` | `frontend/app.js`                              |
| Phone              | `+380 (44) 123-45-67`                                            | `frontend/contact.html`                        |
| GitHub (org)       | `https://github.com/smallcompany`                                | `frontend/index.html`, `frontend/contact.html` |
| LinkedIn           | `https://linkedin.com/company/smallcompany`                      | `frontend/index.html`, `frontend/contact.html` |
| Repository link    | `https://github.com/oleksandkov/oleksandkov-maded`               | Footer across pages                            |

---

### How to Use This Document

1. Decide which copy, link, or contact detail needs to change.
2. Locate the matching section above to find its source file and context.
3. Update the HTML/JS file accordingly (or adjust Express responses for backend messages).
4. Re-run through the associated UI to verify changes.

When you’re ready with revised text, share the updated wording and I can help integrate it back into the codebase.
