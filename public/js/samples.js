const SAMPLES = {
  food: `Develop an online food delivery application.

Users can register and login with email or mobile number.
Restaurants can manage their menus, pricing, and availability.
Customers can browse restaurants, search by cuisine, and place orders.
Secure online payment via credit card, debit card, and UPI.
Real-time GPS-based order tracking after order is placed.
Admin dashboard to manage users, restaurants, and disputes.
Push notifications for order status updates.
Rating and review system for restaurants and delivery partners.
Delivery partner mobile app for accepting and completing deliveries.`,

  hospital: `Build a Hospital Management System for a multi-specialty hospital.

Patient registration and OPD queue management.
Doctor appointment scheduling and calendar management.
Electronic Health Records (EHR) with history and prescriptions.
IPD ward and bed management with real-time availability.
Pharmacy inventory management and drug dispensing.
Lab test ordering, result entry, and report generation.
Billing, insurance claims, and payment processing.
Staff payroll and HR management module.
Admin reports and analytics dashboard.
Ambulance dispatch and tracking.`,

  ecommerce: `Create a multi-vendor e-commerce platform similar to Amazon.

Vendors can register, list products, and manage inventory.
Customers can browse, search, filter, and purchase products.
Shopping cart with saved items and wishlists.
Multiple payment methods: cards, wallets, COD, EMI.
Order management with tracking and delivery updates.
Returns and refund processing workflow.
Product reviews, ratings, and Q&A section.
Loyalty rewards and coupon management system.
Seller analytics dashboard with sales reports.
Customer support chat with ticketing system.
Mobile apps for iOS and Android.`,

  fintech: `Build an AI-Powered FinTech Wealth Manager.

Users can securely link bank accounts and view aggregated portfolios.
AI analysis of spending habits and risk profile to recommend customized asset allocations (mutual funds, stocks, gold).
Automated monthly investments (SIPs) via integration with payment APIs.
Smart tax-saving calculator and filing recommendations.
Real-time stock alerts and portfolio rebalancing suggestions.
Secure biometric login and double-factor authentication.`,

  smarthome: `Develop an IoT-based Smart Home Energy Management dashboard.

Connects to household smart plugs and smart energy meters.
Real-time monitoring of electricity consumption per appliance.
Automated power cutoff schedules and peak-hour alerts to minimize electricity bills.
AI-driven diagnostics predicting appliance maintenance requirements based on power patterns.
Customer mobile app with alerts, billing estimates, and carbon footprint tracker.`,

  rideshare: `Create a decentralized, P2P ride-sharing application.

Passengers can request rides, specify start/end locations, and view estimated prices.
Drivers can view nearby requests, accept rides, and navigate using GPS.
Algorithmic surge-pricing based on demand density and traffic patterns.
In-app digital wallet supporting instant split payments and card processing.
Multi-party safety system with SOS alerts and live trip sharing.`
};

function loadSample(key) {
  document.getElementById('requirementsInput').value = SAMPLES[key];
}
