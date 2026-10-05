import type { ScamType } from "./schema.ts";

// Real reports use one phrasing set; the Text agent writes from a disjoint, paraphrased set,
// so no synthetic snippet can ever be a verbatim copy of a real one.
type Template = { text: string; hinglish: boolean };

export const REAL_TEMPLATES: Record<ScamType, Template[]> = {
  "Digital Arrest": [
    { text: "This is Cyber Crime Branch. A parcel in your name has illegal items. Stay on video call or you will be arrested.", hinglish: false },
    { text: "Your Aadhaar is linked to a money laundering case. Do not disconnect, transfer ₹{amt} for verification.", hinglish: false },
    { text: "Aap digital arrest mein hain. Call cut kiya toh police ghar aayegi.", hinglish: true },
  ],
  "KYC Update": [
    { text: "Dear customer, your bank KYC has expired. Account will be blocked today. Update at [link]", hinglish: false },
    { text: "Your PAN is not updated, account suspended in 24 hrs. Share OTP to reactivate.", hinglish: false },
    { text: "KYC pending hai, aaj raat account band ho jayega. Is link pe details bharo.", hinglish: true },
  ],
  "UPI Collect": [
    { text: "Sir galti se ₹{amt} aapke UPI pe bhej diya, please wapas kar do, request bheji hai.", hinglish: true },
    { text: "Refund of ₹{amt} is pending. Enter UPI PIN to receive the amount.", hinglish: false },
    { text: "Your electricity refund is ready. Approve the collect request to get money.", hinglish: false },
  ],
  "Task Job": [
    { text: "Earn ₹3,000/day by liking videos. Join our Telegram group for tasks.", hinglish: false },
    { text: "Part-time work from home, daily payout. First pay ₹{amt} to unlock premium tasks.", hinglish: false },
    { text: "Ghar baithe kamao! Review karo, paise kamao. Registration fee sirf ₹{amt}.", hinglish: true },
  ],
  Investment: [
    { text: "VIP stock tips group, guaranteed 40% monthly returns. Limited seats.", hinglish: false },
    { text: "Invest ₹{amt} in our crypto app, returns doubled in 30 days.", hinglish: false },
    { text: "Paisa double scheme, sirf 30 din mein. Abhi invest karo warna seat full.", hinglish: true },
  ],
  Lottery: [
    { text: "Congratulations! You won ₹25 lakh in a lucky draw. Pay ₹{amt} GST to claim.", hinglish: false },
    { text: "Aapka mobile number lottery mein select hua hai. Processing fee bhejo.", hinglish: true },
    { text: "You won a smartphone in our anniversary contest. Pay delivery charge ₹{amt}.", hinglish: false },
  ],
};

export const SYNTH_TEMPLATES: Record<ScamType, Template[]> = {
  "Digital Arrest": [
    { text: "Cyber Cell officer speaking. Illegal package booked on your ID. Keep camera on, do not tell family.", hinglish: false },
    { text: "Arrest warrant issued in your name. Settle ₹{amt} as security deposit to avoid custody.", hinglish: false },
    { text: "Video call band mat karna, aap investigation mein ho. Account verify karne ke liye paise bhejo.", hinglish: true },
  ],
  "KYC Update": [
    { text: "ALERT: KYC verification failed. Your account will freeze at midnight. Verify here [link]", hinglish: false },
    { text: "Netbanking blocked due to pending KYC. Tell us the OTP received to unblock.", hinglish: false },
    { text: "Aapka KYC expire ho gaya hai. Turant update karo warna account block.", hinglish: true },
  ],
  "UPI Collect": [
    { text: "Bhai mistake se ₹{amt} transfer ho gaya, collect request accept kar do please.", hinglish: true },
    { text: "Cashback of ₹{amt} credited. Enter PIN to move it to your account.", hinglish: false },
    { text: "Gas subsidy refund pending. Approve the request on your UPI app to receive.", hinglish: false },
  ],
  "Task Job": [
    { text: "Simple online tasks, ₹2,500 daily. Message us on Telegram to start today.", hinglish: false },
    { text: "Hotel review job, instant payout. Deposit ₹{amt} to unlock VIP tasks.", hinglish: false },
    { text: "Daily income ghar se! Bas videos like karo. Joining fee ₹{amt}.", hinglish: true },
  ],
  Investment: [
    { text: "Exclusive trading group: 35% returns every month, assured. Join now.", hinglish: false },
    { text: "Put ₹{amt} in our forex app and double it within a month.", hinglish: false },
    { text: "Guaranteed munafa! Hamare trading group mein aaj hi judo, seats limited.", hinglish: true },
  ],
  Lottery: [
    { text: "Lucky winner! ₹15 lakh prize unlocked. Pay ₹{amt} tax to release.", hinglish: false },
    { text: "Aapka number bumper draw mein jeeta hai. Claim karne ke liye fee bhejo.", hinglish: true },
    { text: "You have won a car in our festive draw. Pay registration ₹{amt}.", hinglish: false },
  ],
};

export const SLOT_AMOUNTS = ["499", "999", "1,499", "2,999", "4,999", "9,999", "24,500"];
