# Product Requirements Document: POS Pro

**Document Version:** 1.0  
**Date:** October 4, 2025  
**Author:** Senior Product Manager  
**Status:** Draft for Review

---

## 1. Executive Summary

### Product Vision & Primary Goals
POS Pro will be the central nervous system for modern restaurants, unifying in-house dining, third-party delivery, and first-party online ordering into a single, elegant command center. Our mission is to eliminate the operational chaos of managing multiple platforms, replacing it with streamlined efficiency. The core differentiator and primary value driver is a powerful, unified analytics and Profit & Loss (P&L) dashboard that empowers operators to make strategic, data-driven decisions that directly impact their bottom line.

The primary business goals are:
1.  **Reduce Operational Overhead:** Decrease labor costs and errors by unifying order management and menu updates into a single interface, targeting a 30% reduction in time spent on administrative platform management.
2.  **Increase Restaurant Profitability:** Provide actionable analytics on menu performance, channel profitability, and operational efficiency to increase average profit margins by 5-10%.
3.  **Capture Market Share:** Become the leading all-in-one POS for independent and multi-location restaurants by offering a superior, scalable solution that combines aggregation and analytics more effectively than any competitor.

### Target Launch Timeline
We will pursue a phased, 6-month development cycle for the Minimum Viable Product (MVP). The target launch for our pilot program is Q2 2026.

### Key Stakeholders
* **CEO:** Final approval of vision, budget, and strategic alignment.
* **Head of Product:** Document owner, responsible for product strategy and roadmap.
* **Lead Engineer / CTO:** Responsible for technical architecture, feasibility, and development execution.
* **Head of Sales & Marketing:** Responsible for go-to-market strategy, pricing, and generating early-adopter interest.
* **Head of Customer Success:** Responsible for onboarding planning and user support strategy.

---

## 2. Problem Statement & Market Analysis

### User Pain Points
Restaurant operators today are caught in a cycle of reactive management, burdened by systems that create more work instead of providing leverage. Their critical pain points include:
* **"Tablet Hell":** The front counter is cluttered with multiple tablets (Uber Eats, Deliveroo, Just Eat, etc.), each with its own alert sounds and workflow. This leads to missed orders, incorrect entries into the primary POS, and a chaotic staff experience.
* **Fragmented Data Silos:** Sales data from in-house dining, third-party delivery, and a separate online store exist in isolated spreadsheets or dashboards. This makes it impossible to get a true, consolidated view of business performance, preventing effective menu engineering or profitability analysis by channel.
* **Operational Inefficiency:** Updating a menu item's price or marking it as "sold out" requires logging into multiple platforms, a time-consuming and error-prone process. This leads to lost revenue and customer dissatisfaction when orders are accepted for unavailable items.
* **High Cost of Alternatives:** Existing solutions are either simple aggregators lacking a core POS, forcing businesses to pay for two systems, or are enterprise-grade platforms with prohibitive costs and complexity for small to medium-sized businesses.

### Market Opportunity
The global cloud-based POS market is projected to exceed $10 billion by 2028, driven by the digital transformation of the restaurant industry. The explosion of the food delivery market, which continues its strong growth trajectory, has made operational efficiency and channel management a top priority for survival and growth. Restaurants urgently need a single source of truth to manage this complexity, representing a significant addressable market for a well-designed, integrated solution.

### Competitive Landscape
* **UrbanPiper:** A strong competitor in the integration-as-a-service space.
    * **Strengths:** Robust and extensive API integrations with a wide array of delivery platforms and POS systems. They are experts in the "plumbing" of order aggregation.
    * **Weaknesses:** Their primary focus is middleware. Their user-facing applications (POS or analytics) are often less developed or non-existent, forcing clients to piece together their tech stack. The analytics are typically limited to order volume and value, not deep profitability insights.
* **Lightspeed Restaurant:** A comprehensive POS platform with a strong feature set.
    * **Strengths:** A mature, all-in-one POS with features covering inventory, payments, loyalty, and reporting. Their analytics suite is powerful for analyzing in-house operations.
    * **Weaknesses:** Their third-party delivery integrations can feel like a "bolt-on" rather than a core, seamlessly integrated feature. The deep analytics that drive real P&L insights are often locked behind higher-tier plans, making them inaccessible to smaller businesses. The UI can be complex due to the sheer breadth of features.
* **POS Pro's Strategic Differentiator:** Our strategy is to surgically combine the core strengths of both competitors into a single, unified platform. We will offer the seamless, deep integration capabilities of UrbanPiper as a core, native feature of a modern, intuitive POS. Our "crown jewel" will be an analytics and P&L dashboard that is more powerful, accessible, and actionable than Lightspeed's, designed from the ground up to analyze a blended business model of in-house and off-premise sales.

---

## 3. Target Users & Personas

### Primary Persona: Alex Chen, The Strategic Restaurant Owner
* **Role:** Owner of "The Golden Bao," a successful 3-location modern bistro.
* **Goals:** Increase overall profitability across all locations. Make strategic decisions about menu pricing and offerings based on data. Plan expansion to a fourth location. Reduce reliance on costly third-party delivery platforms by growing his own first-party channel.
* **Frustrations:** Cannot get a simple, unified P&L view without manually exporting data from 4 different systems into a complex spreadsheet. Suspects his highest-selling delivery item is actually his least profitable but can't easily prove it. Wastes too much time on operational fires instead of strategic planning.
* **Key Tasks in POS Pro:**
    * Viewing the main P&L dashboard daily to check gross sales, net profit, and channel performance.
    * Analyzing the "Menu Engineering" report to identify "Stars" (high profit, high popularity) and "Dogs" (low profit, low popularity).
    * Comparing the profitability of an item sold in-house vs. via Uber Eats (accounting for commissions).
    * Performing a global price update for a key ingredient across all menu items and all sales channels.

### Secondary Personas
* **The Operations-Focused Shift Manager (Maria):** Needs to ensure every order is processed correctly and on time, regardless of its source. Uses POS Pro to manage order flow to the kitchen, handle item availability ("86-ing" an item), and generate end-of-day sales reports.
* **The Front-of-House Cashier (Ben):** Needs to take in-house orders and payments quickly and accurately. Uses POS Pro's table layout and order entry screen. Values speed, clarity, and ease of use for splitting bills and applying discounts.
* **The Back-of-House Kitchen Staff (Chef Rico):** Needs a single, unified Kitchen Display System (KDS) that clearly shows all incoming orders from all channels in a prioritized queue. Values clear modifiers, timers for each order, and the ability to mark orders as "ready."
* **The Delivery Driver (Jamal, using the P2 add-on app):** Needs to see assigned orders with clear customer details and addresses. Uses the app for optimized routing and to update the central POS with real-time status like "Out for Delivery" and "Delivered."

### User Journey Mapping (Alex Chen)
1.  **Onboarding:** Alex signs up and is guided through a setup wizard. He connects his Stripe account for payments and uses secure logins to authorize POS Pro to access his Uber Eats, Deliveroo, and Just Eat merchant accounts.
2.  **Configuration:** He imports his existing menu via a CSV file. The system allows him to map this single menu to all connected delivery platforms.
3.  **First Day of Operation:** His staff uses the single POS Pro interface. Orders from all channels flow directly into the system and to the KDS, eliminating "tablet hell."
4.  **First Month Analysis:** At the end of the month, Alex logs into the Analytics Dashboard. He inputs his labor costs from the Rota module and his food costs from the Inventory module. The P&L dashboard automatically calculates his net profit, breaking down revenue, commissions, and costs by channel. He discovers that his best-selling burger on Deliveroo has a net margin of only 5% due to commission fees, while a lower-volume pasta dish sold in-house has a 45% margin, prompting a strategic menu price adjustment.

---

## 4. Core Features & Functionality

### Module 1: Core POS System (P0)
* **Feature: Table Management**
    * **User Story:** As a Shift Manager, I want a visual layout of my restaurant floor plan, so that I can manage table status (open, seated, dirty) and assign servers efficiently.
    * **Acceptance Criteria (AC):**
        * Users can create a custom floor plan by dragging and dropping tables.
        * Tables must display a color-coded status (e.g., Green for Open, Blue for Seated, Red for Needs Cleaning).
        * Tapping a table opens the order screen for that table.
* **Feature: Order Entry**
    * **User Story:** As a Cashier, I want to quickly add items to an order, including mandatory and optional modifiers, so that I can process customer requests accurately and reduce ordering time.
    * **AC:**
        * The menu must be searchable and organized by category.
        * Selecting an item with modifiers must prompt the user to select them (e.g., "Steak" prompts for "How would you like it cooked?").
        * The system must support order-level and item-level notes.
* **Feature: Payment Processing**
    * **User Story:** As a Cashier, I want to process payments via multiple methods and easily split bills, so that I can accommodate customer needs and close out tables efficiently.
    * **AC:**
        * System must integrate with Stripe for card-present and card-not-present transactions.
        * Must support Cash, Card, and custom payment types (e.g., "Voucher").
        * Must support splitting a bill evenly ($n$ ways) or by item.

### Module 2: Delivery Platform Aggregator (P0)
* **Feature: Unified Order Inbox**
    * **User Story:** As a Shift Manager, I want to see all incoming orders from in-house, Uber Eats, Deliveroo, and Just Eat in a single, unified list, so that I never miss an order and can manage kitchen capacity effectively.
    * **AC:**
        * New orders must appear in the inbox in real-time (< 5-second delay from source).
        * Each order must clearly display its source (e.g., with a logo).
        * Users must be able to Accept or Reject an order with one click, which sends a notification back to the source platform via API.
* **Feature: Centralized Menu Management**
    * **User Story:** As a Restaurant Owner, I want to update an item's price, description, or image in one place, so that the changes are automatically pushed to my POS, Uber Eats, Deliveroo, and Just Eat menus.
    * **AC:**
        * The "Menu" section has a "Publish" button with checkboxes for each connected channel.
        * Upon publishing, the system makes API calls to update the menu on all selected platforms.
        * A log must be available to show the success or failure of each platform's sync.
* **Feature: Centralized Availability Control**
    * **User Story:** As a Shift Manager, when we run out of an ingredient, I want to mark an item as "unavailable" once, so that it is immediately removed from sale on all online channels to prevent customer complaints.
    * **AC:**
        * The POS interface must have a simple toggle or "86" button next to each menu item.
        * Activating this button must immediately make the item unavailable on all connected third-party platforms via API.
        * Re-enabling the item must also sync across all platforms.

### Module 3: Analytics & P&L Dashboard
* **P0 Feature: Unified Sales Reporting**
    * **User Story:** As a Restaurant Owner, I want to see a single report of my total sales, broken down by channel (In-house, Uber Eats, etc.), so that I can understand where my revenue is coming from.
    * **AC:**
        * The dashboard must have a date-range selector.
        * It must display total revenue as a sum of all channels.
        * A pie chart or bar graph must visualize the percentage of sales contributed by each channel.
        * Must show key metrics: total orders, total revenue, and average order value per channel.
* **P1 Feature: P&L Reporting Tool**
    * **User Story:** As a Restaurant Owner, I want to input my costs for labor and goods, so that I can see a true P&L statement and understand my restaurant's actual profitability.
    * **AC:**
        * The system must have an input field for a date range to define total labor cost (from Rota module or manual entry).
        * The system must calculate Cost of Goods Sold (COGS) based on sales and ingredient costs from the Inventory module.
        * The dashboard must display: Revenue - Delivery Commissions - COGS - Labor = Net Profit.
        * Profit margin (%) must be calculated and displayed.

### Module 4: Basic Inventory & Staff Management (P1)
* **Feature: Simple Stock & Cost Tracking**
    * **User Story:** As a Shift Manager, I want to input invoices for my ingredients and link them to menu items, so that the system can track my COGS automatically.
    * **AC:**
        * Users can create a list of ingredients (e.g., "Beef Patty," "Bun," "Cheese Slice").
        * Users can associate a cost with each ingredient.
        * Menu items can be composed of ingredients (e.g., 1 "Classic Burger" = 1 "Beef Patty" + 1 "Bun" + 2 "Cheese Slices").
        * The system uses this data to calculate the cost of each menu item sold.

### Module 5: Customer-Facing App/Website Builder (P1)
* **Feature: Template-Based PWA Builder**
    * **User Story:** As a Restaurant Owner, I want to create a simple online ordering website using a wizard, so that I can capture commission-free, first-party orders without needing a developer.
    * **AC:**
        * A step-by-step wizard guides the user through uploading a logo, choosing brand colors, and adding their location/hours.
        * The wizard automatically pulls the menu from the central POS Pro system.
        * The output is a published Progressive Web App (PWA) with a unique URL.
        * Orders from the PWA must appear in the Unified Order Inbox, labeled as "First-Party Online."

### Module 6: Delivery Driver Logistics App (P2)
* **Feature: Simple Driver Mobile App**
    * **User Story:** As a Delivery Driver, I want a simple mobile app that shows me the orders I need to deliver, with customer addresses and contact info, so I can complete my deliveries efficiently.
    * **AC:**
        * A manager can assign an order to a specific driver from the main POS.
        * The driver receives a push notification on the app for the new order.
        * The app provides one-click access to the customer's location in Google/Apple Maps.
        * The driver can update the order status to "Delivered" in the app, which updates the main POS.

---

## 5. Technical Requirements

### Technology Stack
* **Frontend & Application Logic:** Next.js.
* **Backend, Database, Auth:** Supabase.
* **Rationale:** This stack is chosen for rapid development velocity and scalability. Next.js enables the creation of a fast, responsive Progressive Web App (PWA) that works on any device. Supabase provides a managed PostgreSQL database, authentication, and real-time capabilities out-of-the-box, significantly reducing backend development time and allowing the team to focus on core product features.

### Performance Benchmarks
* **Order Injection Latency:** A new order from any third-party API must be visible on the POS and Kitchen Display System (KDS) in under 3 seconds.
* **Application Load Time:** The PWA must achieve a Largest Contentful Paint (LCP) of under 2 seconds on a standard 4G mobile connection.
* **Peak Load Capacity:** The system architecture must support a sustained peak load of 500 concurrent orders per hour for a multi-location client with 10 branches without performance degradation.

### Security & Compliance
* The platform must be fully GDPR compliant, with clear data privacy policies.
* All payment processing will be handled by Stripe's SDKs and APIs to ensure PCI compliance. No raw credit card data will ever be stored on our servers.
* All user data and API keys will be encrypted at rest and in transit.

### Third-Party Integrations
The system requires robust integration with delivery platform APIs. The core capabilities needed from each partner's API are:
* **Incoming Orders:** A webhook to receive new order data in real-time.
* **Order Management (REST API):** Endpoints to `POST` order acknowledgements (accept/reject) and `PUT` status updates (e.g., `status: "preparing"`, `status: "ready_for_collection"`).
* **Menu Management (REST API):** Endpoints to `PUT` or `POST` entire menu structures in JSON format, including items, descriptions, prices, and nested modifiers.
* **Store Management (REST API):** Endpoints to `PUT` store status (open/closed) and `PUT` item stock status (in_stock/out_of_stock).

### Failure Modes & Edge Cases
* **Network/API Downtime:** If a third-party API is unresponsive, outgoing requests (e.g., menu updates, order acknowledgements) will be added to a retry queue (e.g., using Supabase Edge Functions with a backoff algorithm). The UI must display a clear, non-intrusive alert indicating a connection issue with a specific platform (e.g., "Warning: Unable to sync with Uber Eats").
* **Data Conflicts:** POS Pro is the absolute source of truth for all menu and store data. On initial setup, we will pull the menu from the platform, but once imported, all changes must originate from POS Pro. All API interactions must be logged with correlation IDs for efficient debugging of sync issues.

---

## 6. Success Metrics & KPIs

### User Engagement Metrics
* **Activation Rate:** % of new signups who successfully connect at least one delivery platform and process their first order within 7 days.
* **Daily Active Users (DAU):** Focus on Shift Managers and Owners logging in.
* **Feature Adoption Rate:** % of active users who utilize the P&L dashboard at least once per month.
* **Time to Acknowledge Order:** Average time from order receipt to staff acknowledgement on the POS. Success is a downward trend.

### Business Success Metrics
* **Monthly Recurring Revenue (MRR):** The primary measure of business growth.
* **Customer Churn Rate:** % of customers who cancel their subscription per month. Target < 2%.
* **Customer Lifetime Value (CLV):** Average total revenue generated by a customer.
* **Net Promoter Score (NPS):** Measured quarterly to gauge customer satisfaction and loyalty. Target > 50.

### Technical Performance Metrics
* **API Uptime:** 99.9% uptime for all core services and third-party integration brokers.
* **Average API Response Time:** < 200ms for all internal API endpoints.
* **Crash-Free Session Rate:** > 99.5% for the web application.

---

## 7. Timeline & Milestones

This high-level roadmap outlines the 6-month MVP launch plan.

* **Phase 1 (Months 1-2): Core & Foundation**
    * **Goal:** Build a functional, standalone POS.
    * **Milestones:** User authentication system complete. Database schema designed and implemented in Supabase. Core POS features (order entry, table management, payment processing with Stripe) are functional for internal testing.
* **Phase 2 (Months 2-4): Integration & Aggregation**
    * **Goal:** Solve the "tablet hell" problem.
    * **Milestones:** API integration layer built. Successful two-way integration with Uber Eats, Deliveroo, and Just Eat. Unified order inbox is live and tested. Centralized menu and availability management are functional.
* **Phase 3 (Months 4-5): Analytics & UI Polish**
    * **Goal:** Deliver the core data-driven value proposition.
    * **Milestones:** P0 analytics dashboard is built, displaying unified sales reports and channel breakdowns. The end-to-end user interface is refined based on design specifications and internal feedback. A guided onboarding flow is created.
* **Phase 4 (Month 6): Alpha/Beta Testing & Launch**
    * **Goal:** Validate the product with real users and prepare for market entry.
    * **Milestones:** Onboard 5-10 pilot restaurants. Collect feedback, fix critical bugs, and conduct performance tuning. Finalize pricing and prepare marketing materials for a public launch.

---

## 8. Risks & Mitigation Strategies

### Technical Risks
* **Risk:** Third-party delivery platform APIs are poorly documented, unreliable, or change without notice.
* **Mitigation:**
    1.  Allocate a 2-week technical spike in Phase 1 to build PoCs for each API and assess their reliability.
    2.  Build a robust abstraction layer so that changes from one API don't require rewriting the entire integration module.
    3.  Implement comprehensive logging and alerting to immediately detect integration failures.

### Market Risks
* **Risk:** Competitors (Lightspeed, etc.) launch a deeply integrated aggregation feature before our MVP is ready, closing our window of opportunity.
* **Mitigation:**
    1.  Our key differentiator is not just aggregation, but the *seamlessness* and the *power of the unified P&L dashboard*. We must lean into this superior UX and analytics messaging in our marketing.
    2.  Begin building a waitlist and engaging with potential customers early (Month 3) to create buzz and lock in early adopters.

### Adoption Risks
* **Risk:** Restaurant owners, who are typically time-poor, find the setup process for connecting platforms and importing menus too complex and abandon onboarding.
* **Mitigation:**
    1.  Invest heavily in a polished, wizard-based onboarding flow that provides clear, step-by-step instructions.
    2.  Create high-quality video tutorials and documentation for every step.
    3.  Offer a "white-glove" onboarding service for our first 50 customers to learn from their challenges and refine the process.

---

## 9. Supplementary Deliverables

Following the approval of this PRD, the product and design teams will create the following assets to guide development:

* **User Flow Diagrams:** Detailed visual diagrams for key user journeys, including:
    * "Onboarding & First-Time Setup"
    * "Processing a Unified Order (from webhook to KDS)"
    * "Updating a Menu Item Across All Channels"
    * "Generating a Monthly P&L Report"
* **Low-Fidelity Wireframes:** A complete set of wireframes (using a tool like Figma or Balsamiq) for the primary screens of the application. This will include the POS order entry screen, the Unified Order Inbox, the KDS view, and the main Analytics & P&L Dashboard.
* **API Specification Outline:** A technical document outlining the proposed internal API endpoints, request/response payloads, and data models required for communication between the Next.js frontend and the Supabase backend.