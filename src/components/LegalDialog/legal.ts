export type LegalDocKey = "terms" | "privacy" | "disclaimer" | "data";

export type LegalBlock =
  | { kind: "h"; text: string }
  | { kind: "sub"; text: string }
  | { kind: "p"; text: string; strong?: boolean }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface LegalDoc {
  title: string;
  updated: string;
  blocks: LegalBlock[];
}

/* Text comes from the legal team's documents (rev 10-8-26 / 10-9-26). */
export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  data: {
    title: "Data Collection Notice",
    updated: "November 6, 2026",
    blocks: [
      {
        "kind": "h",
        "text": "What We Collect and Why"
      },
      {
        "kind": "p",
        "text": "This notice explains what information FORKTHIS!™ (the “Service”) collects, why we collect it, and what is optional. Our full Privacy Policy has complete details, including how we share information and the rights available to you."
      },
      {
        "kind": "p",
        "text": "In short: we collect what we need to personalize your experience. We do not sell your information to third parties, and we do not require payment to use the Service."
      },
      {
        "kind": "h",
        "text": "Information Collected"
      },
      {
        "kind": "table",
        "head": [
          "What",
          "Why we collect it",
          "Required?"
        ],
        "rows": [
          [
            "Email and password",
            "To create and secure your account",
            "Required to create a profile; not required to browse"
          ],
          [
            "Your goals (weight loss, muscle gain, maintenance)",
            "To show content matched to what you are working toward",
            "Required during onboarding"
          ],
          [
            "Age",
            "To confirm eligibility and tailor guidance",
            "Required during onboarding"
          ],
          [
            "Height and weight",
            "To calculate nutritional targets and track progress",
            "Required during onboarding"
          ],
          [
            "Surgical context (pre-surgery, post-surgery, neither)",
            "To adjust guidance for users preparing for or recovering from surgery",
            "Optional"
          ],
          [
            "Foods and meals you log",
            "To provide nutrition tracking and progress information",
            "Optional; only what you choose to enter"
          ],
          [
            "Recipes and items you save",
            "To keep your saved content available",
            "Optional"
          ],
          [
            "Approximate location",
            "To show possible restaurant options near you",
            "Optional; off unless you enable it"
          ],
          [
            "Device and usage information",
            "To operate the app, fix problems, and improve the experience",
            "Collected automatically"
          ]
        ]
      },
      {
        "kind": "h",
        "text": "Health-Related Information"
      },
      {
        "kind": "p",
        "text": "Some of what we collect relates to your body and your health goals, including height, weight, dietary goals, and optionally whether you are preparing for or recovering from surgery."
      },
      {
        "kind": "p",
        "text": "We collect this only to personalize the content shown to you. We do not share it with advertisers, and we do not sell it. You may skip the surgical context question entirely, and you may delete your account and this information at any time."
      },
      {
        "kind": "h",
        "text": "Using the App Without an Account"
      },
      {
        "kind": "p",
        "text": "You can browse recipes and restaurant guidance, and use nutrition tracking, without creating an account."
      },
      {
        "kind": "ul",
        "items": [
          "In guest mode, what you enter stays on your device and is not saved to our systems.",
          "Clearing your app or browser data removes it.",
          "Creating a free profile is required only if you want to save your information across sessions or devices.",
          "Basic device and usage information is still collected automatically, as described above."
        ]
      },
      {
        "kind": "h",
        "text": "Artificial Intelligence Features"
      },
      {
        "kind": "p",
        "text": "The Service uses AI to power natural-language search, an in-app assistant, personalized recommendations, and automatically generated images for recipes without photographs."
      },
      {
        "kind": "ul",
        "items": [
          "Your searches and questions are processed to return results from our own content.",
          "If you ask the assistant about your progress, it accesses only your own information.",
          "Recommendations are generated based on your stated goals, saved items, and usage patterns.",
          "Your information is not used to train any third-party AI models."
        ]
      },
      {
        "kind": "h",
        "text": "Your Choices"
      },
      {
        "kind": "table",
        "head": [
          "You can",
          "How"
        ],
        "rows": [
          [
            "Use the app without an account",
            "Skip sign-up and browse or track as a guest"
          ],
          [
            "Skip optional questions",
            "Leave the surgical context question unanswered"
          ],
          [
            "Turn off location",
            "Device settings, or decline when prompted"
          ],
          [
            "Turn off notifications",
            "Device settings, or in-app notification preferences"
          ],
          [
            "Review or correct your information",
            "Profile settings within the app"
          ],
          [
            "Delete your account and data",
            "Profile settings, or contact us at the address below"
          ]
        ]
      },
      {
        "kind": "h",
        "text": "Users Under Age 18"
      },
      {
        "kind": "p",
        "text": "FORKTHIS!™ is not intended for children under 13, and we do not knowingly collect information from them. You will be asked to confirm you are 13 or older before using the app. If you are under 18, you should not use the Service until you have first reviewed our Terms of Use (as well as our Disclaimer, Privacy Policy, and this Notice, all of which are expressly incorporated therein) with a parent or guardian."
      },
      {
        "kind": "h",
        "text": "Questions?"
      },
      {
        "kind": "p",
        "text": "For questions about this notice or how your information is handled, contact us at admin@forkthisapp.com. Full details are in our Privacy Policy."
      }
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    updated: "November 6, 2026",
    blocks: [
      {
        "kind": "h",
        "text": "1.  No Medical Advice"
      },
      {
        "kind": "p",
        "text": "FORKTHIS!™ (the “Service”) provides general nutrition and wellness lifestyle information for educational purposes only. It does not provide, and should not be considered a source for, professional medical or dietetic advice, diagnosis, or treatment."
      },
      {
        "kind": "p",
        "text": "The information available through the Service is not a substitute for professional medical judgment. Always seek the advice of a physician, registered dietitian, or other qualified healthcare provider with any questions about any possible medical condition, dietary concern, or treatment plan."
      },
      {
        "kind": "p",
        "text": "No physician-patient, dietitian-client, or other professional relationship is created by your use of the Service."
      },
      {
        "kind": "p",
        "text": "If you currently are a patient of a health care professional, your use of the Service does not replace, modify, expand, or otherwise alter your existing professional relationship with that person."
      },
      {
        "kind": "p",
        "text": "Never disregard advice you have received from your licensed professional medical or healthcare provider, or delay seeking such advice, because of something you have read or seen in the Service."
      },
      {
        "kind": "p",
        "text": "In the event of any conflict between information you obtain through use of the Service and instructions you receive from your treating physician, dietitian, or other health-care professional, the instructions of your treating provider should always control."
      },
      {
        "kind": "p",
        "text": "The Service is not designed for use in emergencies. If you believe you are experiencing a medical emergency, contact your physician, call emergency services, or otherwise seek immediate emergency medical attention."
      },
      {
        "kind": "p",
        "text": "The Service does not provide a means to communicate with a physician or other health-care professional for medical, dietary, or lifestyle advice. Communications with administrators of the Service are limited to technical support and troubleshooting."
      },
      {
        "kind": "h",
        "text": "2.  Users Preparing For or Recovering From Surgery"
      },
      {
        "kind": "p",
        "text": "The Service allows you to indicate that you are preparing for or recovering from surgery (including but not limited to bariatric surgery) and adjusts the content shown to you accordingly. This adjustment is based on general information and is not personalized medical guidance."
      },
      {
        "kind": "p",
        "text": "Nutritional requirements before and after surgery vary significantly by surgical procedure type, by individual, and by stage of recovery. Your individual nutritional plan for both your preparation for and your recovery from your surgery will be determined and communicated by your surgical and medical team only. The general informational content shown in the Service must not ever be substituted for, or construed in a manner that would modify in any way, the specific instructions given to you by your surgeon, bariatric team, or treating physician. Where the Service and your care team differ, always follow your care team."
      },
      {
        "kind": "p",
        "text": "Do not begin, change, or discontinue any pre-operative or post-operative eating plan based on the Service. Look solely to your treating physician to provide such plan and any and all associated guidance."
      },
      {
        "kind": "h",
        "text": "3.  Individual Results and Medical Conditions"
      },
      {
        "kind": "p",
        "text": "Individual results vary. Any outcomes described, depicted, or referenced within the Service, including in content associated with its founders, reflect individual experiences and are not typical, guaranteed, or predictive of your results."
      },
      {
        "kind": "p",
        "text": "Weight, body composition, and health outcomes depend on many factors, including genetics, medical history, medication, activity, and adherence, most of which are outside the control of the Service."
      },
      {
        "kind": "p",
        "text": "If you have a medical condition, are pregnant or nursing, are taking prescription medication including (but not limited to) weight-management medication, or have a history of disordered eating, consult your healthcare provider before using the Service or making any dietary changes based on it."
      },
      {
        "kind": "h",
        "text": "4.  Nutritional, Restaurant, and Allergen Information"
      },
      {
        "kind": "p",
        "text": "Nutritional values, ingredients, portion sizes, calorie content, and preparation details shown in the Service are estimates. They are derived from information supplied by the Service’s operators or from publicly available sources, and may be inaccurate, incomplete, or out of date."
      },
      {
        "kind": "ul",
        "items": [
          "Restaurant menus, recipes, ingredients, and nutritional information change without notice and may vary by location.",
          "Preparation methods, portion sizes, and substitutions at individual locations affect nutritional content.",
          "Any values shown in the Service should be treated as approximate guidance rather than precise measurement."
        ]
      },
      {
        "kind": "p",
        "text": "If you have a known food allergy or intolerance, or any other medically required or recommended dietary restriction, it is imperative that you verify all ingredients yourself, directly with the restaurant or manufacturer, before consuming any item. The Service should never be relied upon to identify potential allergens or any other foods or ingredients that are contraindicated for your medical condition or situation."
      },
      {
        "kind": "h",
        "text": "5.  Artificial Intelligence Generated Content"
      },
      {
        "kind": "p",
        "text": "The Service uses artificial intelligence to power search, an in-app assistant, personalized suggestions, and imagery for recipes that do not have photographs."
      },
      {
        "kind": "sub",
        "text": "5.1  AI assistant responses"
      },
      {
        "kind": "ul",
        "items": [
          "The assistant draws only on content within the Service and does not provide medical, nutritional, or professional advice.",
          "Responses may be incomplete or inaccurate and should not be relied upon as authoritative.",
          "Where the assistant refers to your own tracked information, it reflects only what you have entered and does not verify accuracy."
        ]
      },
      {
        "kind": "sub",
        "text": "5.2  Generated imagery"
      },
      {
        "kind": "p",
        "text": "Images generated by the Service are illustrative representations produced automatically. They may not accurately depict the actual appearance, ingredients, portion size, or preparation of the item shown, and should not be used to identify ingredients or assess portion size."
      },
      {
        "kind": "sub",
        "text": "5.3  Personalized suggestions"
      },
      {
        "kind": "p",
        "text": "Recommendations are generated automatically based on information you provide and your activity within the Service. They are general suggestions, not individualized professional guidance, and do not account for your full medical history."
      },
      {
        "kind": "h",
        "text": "6.  Third-Party Content and Brands"
      },
      {
        "kind": "p",
        "text": "Restaurant names, brands, logos, and menu items referenced in the Service are the property of their respective owners and are used for identification and descriptive purposes only. Their appearance at any time on the Service does not imply any affiliation with, sponsorship by, or endorsement by those businesses. SamJoeProductions, LLC is not affiliated with any restaurant or brand referenced. If any such affiliation were ever to be created, such affiliation would be expressly stated."
      },
      {
        "kind": "p",
        "text": "SamJoeProductions, LLC is not responsible for the products, services, practices, or content of any third party referenced or linked within the Service."
      },
      {
        "kind": "h",
        "text": "7.  Accuracy and Availability"
      },
      {
        "kind": "p",
        "text": "SamJoeProductions, LLC makes reasonable efforts to keep the Service and the information contained therein accurate and current, but we do not represent or warrant that content within the Service is accurate, complete, reliable, or current."
      },
      {
        "kind": "p",
        "text": "Content on the Service may be updated or removed at any time without notice. The Service may be unavailable from time to time."
      },
      {
        "kind": "h",
        "text": "8.  Limitation of Liability"
      },
      {
        "kind": "p",
        "text": "To the fullest extent permitted by law, SamJoeProductions, LLC shall not be liable for any injury, loss, or damage arising from your reliance on information provided through the Service, including any dietary, nutritional, or health decision made on the basis of that information."
      },
      {
        "kind": "p",
        "text": "This provision is subject to, and should be read together with, the limitation of liability set out in our Terms of Use."
      },
      {
        "kind": "h",
        "text": "9.  Acknowledgement"
      },
      {
        "kind": "p",
        "text": "By using the Service, you acknowledge that you have read and understood this Disclaimer, that you use the Service at your own risk, and that you are responsible for decisions you make about your diet and health."
      },
      {
        "kind": "h",
        "text": "10.  Contact"
      },
      {
        "kind": "p",
        "text": "Questions about this Disclaimer may be directed to:"
      },
      {
        "kind": "table",
        "head": [
          "Entity",
          "SamJoeProductions, LLC"
        ],
        "rows": [
          [
            "Email",
            "admin@forkthisapp.com"
          ],
          [
            "Address",
            "10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117"
          ]
        ]
      }
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "November 6, 2026",
    blocks: [
      {
        "kind": "h",
        "text": "1.  Introduction"
      },
      {
        "kind": "p",
        "text": "SamJoeProductions, LLC (“we,” “us,” or “our”) operates FORKTHIS!™ (the “Service”), a nutrition and lifestyle platform available as a website and as mobile applications for iOS and Android. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices available to you."
      },
      {
        "kind": "p",
        "text": "By using the Service, you agree to the collection and use of information as described in this Policy. If you do not agree, please do not use the Service."
      },
      {
        "kind": "h",
        "text": "2.  Important Notice About Health Information"
      },
      {
        "kind": "p",
        "text": "The Service allows you to provide information about your health goals, body measurements, and, optionally, surgical history. This information is used solely to personalize the content and guidance shown to you."
      },
      {
        "kind": "p",
        "text": "SamJoeProductions, LLC is not a covered entity or business associate under the Health Insurance Portability and Accountability Act (HIPAA), and information you provide through the Service is not protected health information under HIPAA. The Service provides general nutrition and lifestyle information only; please see our Disclaimer for the full statement on the nature and limitations of that information."
      },
      {
        "kind": "h",
        "text": "3.  Information We Collect"
      },
      {
        "kind": "sub",
        "text": "3.1  Information you provide directly"
      },
      {
        "kind": "ul",
        "items": [
          "Account information: name, email address, and password when you create a profile.",
          "Onboarding information: your stated goal (such as weight loss, muscle gain, or maintenance), age, height, weight, and optionally whether you are preparing for or recovering from surgery.",
          "Nutrition tracking data: foods, meals, and quantities you log.",
          "Saved content: recipes and restaurant items you save or mark as favorites.",
          "Communications: information you provide when you contact us for support."
        ]
      },
      {
        "kind": "sub",
        "text": "3.2  Information collected automatically"
      },
      {
        "kind": "ul",
        "items": [
          "Device and technical information: device type, operating system, browser type, and unique device identifiers.",
          "Usage information: features accessed, content viewed, time spent, and interaction patterns.",
          "Log data: IP address, access times, and pages or screens viewed.",
          "Your location (if, but only if, you opt to enable location sharing), used to show restaurant guidance near you. Your location will not be stored."
        ]
      },
      {
        "kind": "sub",
        "text": "3.3  Use without an account"
      },
      {
        "kind": "p",
        "text": "You may browse content and use nutrition tracking without creating an account. In guest mode, information you enter is stored temporarily on your device and is not saved to our systems unless you create a profile. Automatically collected technical and usage information may still be gathered as described above."
      },
      {
        "kind": "sub",
        "text": "3.4  Information we do not collect"
      },
      {
        "kind": "p",
        "text": "We do not collect payment or financial account information through the Service."
      },
      {
        "kind": "h",
        "text": "4.  How We Use Information"
      },
      {
        "kind": "ul",
        "items": [
          "To provide, operate, and maintain the Service.",
          "To personalize content and recommendations based on your stated goals and preferences.",
          "To enable features such as search, saved items, and progress tracking.",
          "To send notifications and messages you have enabled, including reminders and motivational content.",
          "To respond to your questions and provide support.",
          "To compile usage data (stripped of any personal identifying information) for use in analyzing usage patterns and improving the Service.",
          "To also use such compiled usage data (stripped of any personal identifying information) for research and/or marketing purposes",
          "To detect, prevent, and address technical issues, fraud, or misuse.",
          "To comply with legal obligations."
        ]
      },
      {
        "kind": "h",
        "text": "5.  Artificial Intelligence Features"
      },
      {
        "kind": "p",
        "text": "The Service includes features powered by artificial intelligence (AI), including natural-language search, an in-app assistant, personalized recommendations, and automatically generated imagery for recipes that do not have photographs."
      },
      {
        "kind": "sub",
        "text": "5.1  How AI features use your information"
      },
      {
        "kind": "ul",
        "items": [
          "Search queries and assistant questions are processed to return relevant results from our content library.",
          "Where you ask the assistant about your own progress, it accesses only your own tracked data.",
          "Recommendations are generated based on your stated goals, saved items, and usage patterns."
        ]
      },
      {
        "kind": "sub",
        "text": "5.2  Third-party AI processing"
      },
      {
        "kind": "p",
        "text": "AI features are provided using third-party services operating within our cloud environment. Information processed by these features is not used to train any third-party AI models."
      },
      {
        "kind": "sub",
        "text": "5.3  Scope of assistant access"
      },
      {
        "kind": "p",
        "text": "The AI in-app assistant responds only using content within the Service and, where you ask about your own progress, only your own tracked data. It does not access other users’ information. Limitations on the accuracy and appropriate use of AI-generated content are addressed in our Disclaimer."
      },
      {
        "kind": "h",
        "text": "6.  How We Share Information"
      },
      {
        "kind": "p",
        "text": "We do not sell your personal information. We share information only in the following circumstances:"
      },
      {
        "kind": "ul",
        "items": [
          "Service providers: cloud hosting, analytics, notification delivery, and AI processing providers who process information on our behalf under contractual obligations.",
          "Legal requirements: where required by law, regulation, legal process, or governmental request.",
          "Protection of rights: where necessary to protect our rights, safety, or property, or that of our users or the public.",
          "Business transfers: in connection with a merger, acquisition, financing, or sale of assets, in which case this Policy will continue to apply or you will be notified of any changes.",
          "With your consent: where you direct us to share information."
        ]
      },
      {
        "kind": "h",
        "text": "7.  Data Retention"
      },
      {
        "kind": "p",
        "text": "We retain information for as long as your account remains active, or as needed to provide the Service. Where you delete your account, we delete or de-identify your personal information within thirty (30) days, except where retention for any different period is required for legal, accounting, or security purposes. Guest-mode information stored on your device is removed when you clear application data."
      },
      {
        "kind": "h",
        "text": "8.  Security"
      },
      {
        "kind": "p",
        "text": "We use commercially reasonable technical and organizational measures to protect your information, including encryption of data in transit and at rest, access controls, and audit logging. No method of transmission or storage is completely secure, and we cannot guarantee absolute security."
      },
      {
        "kind": "h",
        "text": "9.  Your Rights and Choices"
      },
      {
        "kind": "ul",
        "items": [
          "Access and correction: you may access and update your profile information within the Service.",
          "Deletion: you may delete your account and associated data at any time.",
          "Notifications: you may disable push notifications through your device settings.",
          "Location: you may disable location access through your device settings.",
          "Additional rights: depending on where you live, you may have rights to portability, restriction of processing, or to opt out of certain processing."
        ]
      },
      {
        "kind": "p",
        "text": "To exercise any of these rights, contact us at samjoeproductions@gmail.com."
      },
      {
        "kind": "h",
        "text": "10.  Children’s Privacy"
      },
      {
        "kind": "p",
        "text": "The Service is not intended for children under 13, and we do not knowingly collect personal information from children under 13. Users are asked to confirm they are 13 or older before using the Service. If we learn that we have collected information from a child under 13, we will delete it promptly."
      },
      {
        "kind": "h",
        "text": "11.  Third-Party Links and Services"
      },
      {
        "kind": "p",
        "text": "The Service may contain links to third-party websites or applications, including restaurant or food-ordering services. We are not responsible for the privacy practices of those third parties, and we encourage you to review their policies."
      },
      {
        "kind": "h",
        "text": "12.  Changes to This Policy"
      },
      {
        "kind": "p",
        "text": "We may update this Policy from time to time. We will post the updated version in the Service with a revised “Last updated” date, and, where changes are material, we will provide additional notice on the opening screen of the Service and will require you to scroll through the revised Policy and click to confirm that you have reviewed and understood and that you accept same, in order for you to continue your use of the Service after any such changes take effect."
      },
      {
        "kind": "h",
        "text": "13.  Contact Us"
      },
      {
        "kind": "p",
        "text": "If you have questions about this Policy or our handling of your information, contact us at:"
      },
      {
        "kind": "table",
        "head": [
          "Entity",
          "SamJoeProductions, LLC"
        ],
        "rows": [
          [
            "Email",
            "admin@forkthisapp.com"
          ],
          [
            "Address",
            "10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117"
          ]
        ]
      }
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "November 6, 2026",
    blocks: [
      {
        "kind": "p",
        "text": "IMPORTANT: PLEASE BE ADVISED THAT BY AGREEING TO THESE TERMS YOU ARE WAIVING YOUR RIGHT TO SEEK RELIEF IN A COURT OF LAW AND WAIVING YOUR RIGHT TO HAVE A JURY TRIAL ON YOUR CLAIMS.",
        "strong": true
      },
      {
        "kind": "p",
        "text": "PLEASE READ THESE TERMS OF USE CAREFULLY AS THEY CONTAIN PROVISIONS THAT GOVERN HOW YOU CAN BRING CLAIMS AND/OR LAWSUITS BETWEEN YOU AND SAMJOEPRODUCTIONS, LLC, INCLUDING THE “ARBITRATION AGREEMENT” IN SECTION 15 BELOW. THE ARBITRATION AGREEMENT REQUIRES YOU TO RESOLVE ALL DISPUTES WITH SAMJOEPRODUCTIONS, LLC ON AN INDIVIDUAL BASIS AND, WITH LIMITED EXCEPTIONS, THROUGH FINAL AND BINDING ARBITRATION. THESE TERMS OF USE OUTLINE HOW SUCH CLAIMS AND/OR LAWSUITS ARE RESOLVED, INCLUDING, WITHOUT LIMITATION, ANY CLAIMS AND/OR LAWSUITS THAT AROSE OR WERE ASSERTED BEFORE THE EFFECTIVE DATE OF THESE TERMS OF USE. BY AGREEING TO THESE TERMS OF USE, YOU EXPRESSLY ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD ALL OF THEM AND HAVE TAKEN TIME TO CONSIDER THE CONSEQUENCES OF THIS IMPORTANT DECISION.",
        "strong": true
      },
      {
        "kind": "h",
        "text": "1.  Acceptance of These Terms"
      },
      {
        "kind": "p",
        "text": "These Terms of Use (“Terms”) constitute a legally binding agreement between you and SamJoeProductions, LLC (“we,” “us,” or “our”) governing your access to and use of FORKTHIS!™  (the “Service”), operated by us. By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service."
      },
      {
        "kind": "p",
        "text": "These Terms incorporate by reference our Privacy Policy, Data Collection Notice, and Disclaimer, each available within the Service."
      },
      {
        "kind": "h",
        "text": "2.  Eligibility"
      },
      {
        "kind": "p",
        "text": "You must be at least 13 years old to use the Service. By using the Service, you represent that you meet this requirement. If you are under 18, you should not use the Service until you have first reviewed these Terms with a parent or guardian."
      },
      {
        "kind": "h",
        "text": "3.  Description of the Service"
      },
      {
        "kind": "p",
        "text": "The Service provides general nutrition and lifestyle information, including recipes for home cooking, guidance for ordering at restaurants, nutrition tracking tools, and personalized content based on information you provide."
      },
      {
        "kind": "p",
        "text": "The Service is currently offered free of charge and does not require a subscription or payment. We reserve the right to introduce paid features in the future, in which case any applicable fees and terms will be disclosed before you incur them."
      },
      {
        "kind": "p",
        "text": "We may modify, suspend, or discontinue any part of the Service at any time. We will provide reasonable notice of material changes where practicable."
      },
      {
        "kind": "h",
        "text": "4.  Accounts"
      },
      {
        "kind": "p",
        "text": "You may browse content and use nutrition tracking without an account. Creating a free account is required to save information across sessions and devices."
      },
      {
        "kind": "ul",
        "items": [
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You are responsible for all activity that occurs under your account.",
          "You agree to provide accurate information when creating an account and to keep it current.",
          "You must notify us promptly of any unauthorized use of your account.",
          "You may not share your account or transfer it to another person."
        ]
      },
      {
        "kind": "p",
        "text": "We may suspend or terminate accounts that violate these Terms, as described in Section 11."
      },
      {
        "kind": "h",
        "text": "5.  Acceptable Use"
      },
      {
        "kind": "p",
        "text": "You agree not to:"
      },
      {
        "kind": "ul",
        "items": [
          "Use the Service for any unlawful purpose or in violation of any applicable law or regulation.",
          "Attempt to gain unauthorized access to the Service, other users’ accounts, or our systems.",
          "Interfere with, disrupt, or place undue load on the Service or its infrastructure.",
          "Use automated means, including scraping, crawling, or bots, to access or extract content without our prior written permission.",
          "Copy, reproduce, distribute, or create derivative works from Service content except as expressly permitted.",
          "Reverse engineer, decompile, or attempt to derive the source code of the Service.",
          "Impersonate any person or misrepresent your affiliation with any person or entity.",
          "Upload or transmit malicious code, or any content that is unlawful, harassing, or infringing.",
          "Use the Service to provide medical, nutritional, or health advice to third parties in a professional capacity.",
          "Resell, sublicense, or otherwise attempt to make any monetarily gainful use of the Service or its content without our prior written permission."
        ]
      },
      {
        "kind": "h",
        "text": "6.  Intellectual Property"
      },
      {
        "kind": "sub",
        "text": "6.1  Our content"
      },
      {
        "kind": "p",
        "text": "The Service, including its design, features, text, graphics, recipes, restaurant guidance, imagery, software, and all other content, is owned by SamJoeProductions, LLC or its licensors and is protected by Federal and state copyright, trademark, and other intellectual property laws."
      },
      {
        "kind": "p",
        "text": "We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your own personal, non-commercial use. This license does not permit reproduction, distribution, or commercial use of Service content."
      },
      {
        "kind": "sub",
        "text": "6.2  Your content"
      },
      {
        "kind": "p",
        "text": "You retain ownership of information you enter into the Service, including nutrition logs and profile information. By entering such information, you grant us a license to store, process, and display it as necessary to operate the Service and provide features to you."
      },
      {
        "kind": "sub",
        "text": "6.3  Trademarks"
      },
      {
        "kind": "p",
        "text": "FORKTHIS!™ and associated logos are trademarks of SamJoeProductions, LLC. Third-party names and marks referenced within the Service, including restaurant and brand names, are the property of their respective owners and are used for identification purposes only. Their appearance does not imply any affiliation or any other business relationship between the Service (or SamJoeProductions, LLC) and those third parties, or any promotion or endorsement of the Service by those third parties or vice versa."
      },
      {
        "kind": "h",
        "text": "7.  Third-Party Services and Content"
      },
      {
        "kind": "p",
        "text": "The Service may reference or link to third-party businesses, websites, or applications, including restaurants and food-ordering services. We do not control these third parties and are not responsible for their content, products, services, availability, or practices."
      },
      {
        "kind": "p",
        "text": "Nutritional information relating to third-party restaurant items is derived from publicly available or client-supplied sources and may change without notice. Your dealings with any third party are solely between you and that third party."
      },
      {
        "kind": "h",
        "text": "8.  Artificial Intelligence Features"
      },
      {
        "kind": "p",
        "text": "The Service includes features powered by artificial intelligence, including natural-language search, an in-app assistant, personalized recommendations, and automatically generated imagery."
      },
      {
        "kind": "p",
        "text": "You agree to use these features for personal, non-commercial purposes only, and not to attempt to manipulate, circumvent, or extract the underlying systems or their training data. Your use of AI features is subject to the same acceptable-use restrictions set out in Section 5."
      },
      {
        "kind": "p",
        "text": "Important limitations on the accuracy and appropriate use of AI-generated content, including generated imagery and assistant responses, are set out in our Disclaimer, which forms part of these Terms."
      },
      {
        "kind": "h",
        "text": "9.  No Medical Advice"
      },
      {
        "kind": "p",
        "text": "The Service provides general nutrition and lifestyle information only. It does not provide medical, nutritional, or professional health advice, and it is not a substitute for consultation with a qualified healthcare provider."
      },
      {
        "kind": "p",
        "text": "SamJoeProductions, LLC is not a covered entity or business associate under the Health Insurance Portability and Accountability Act (HIPAA), and information you provide through the Service is not protected health information under HIPAA."
      },
      {
        "kind": "p",
        "text": "Our Disclaimer sets out the full terms governing the nature and limitations of information provided through the Service, including limitations pertaining to general information available to users preparing for or recovering from surgery and users managing medical conditions. The Disclaimer forms part of these Terms, and you should read it before using the Service. Your acceptance of these Terms shall be construed as an acknowledgment that you have read and understood the Disclaimer and that you accept its terms."
      },
      {
        "kind": "h",
        "text": "10.  Disclaimers and Limitation of Liability"
      },
      {
        "kind": "sub",
        "text": "10.1  Warranties"
      },
      {
        "kind": "p",
        "text": "If the law of the country, state, or other jurisdiction where you live does not allow for the disclaimer of certain warranties provided in this Section, those disclaimers shall not apply to you to the extent prohibited.",
        "strong": true
      },
      {
        "kind": "p",
        "text": "THE SERVICES ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS. USE OF THE SERVICES IS AT YOUR OWN RISK. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE PROVIDED WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, PRIVACY, SECURITY, ACCURACY, TIMELINESS, QUALITY, OR NON-INFRINGEMENT. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM SAMJOEPRODUCTIONS, LLC OR THROUGH THE SERVICE WILL CREATE ANY WARRANTY NOT EXPRESSLY STATED HEREIN. WITHOUT LIMITING THE FOREGOING, SAMJOEPRODUCTIONS, LLC, OUR SUBSIDIARIES, AFFILIATES, AND LICENSORS DO NOT WARRANT THAT: (A) THE SERVICE OR RESULTS THAT ARE OBTAINED FROM USE OF THE SERVICE WILL BE ACCURATE, RELIABLE, ERROR-FREE OR CORRECT; (B) THE SERVICE OR RESULTS THAT ARE OBTAINED FROM USE OF THE SERVICE WILL MEET YOUR REQUIREMENTS; (C) THE SERVICE WILL BE AVAILABLE AT ANY PARTICULAR TIME OR LOCATION, TIMELY, UNINTERRUPTED, OR SECURE; (D) ANY DEFECTS OR ERRORS IN THE SERVICE WILL BE IMMEDIATELY DETECTED OR CORRECTED; OR (E) THE SERVICE IS 100% INCAPABLE OF BEING HACKED OR OF BEING INFECTED WITH VIRUSES, MALWARE, OR OTHER HARMFUL COMPONENTS. ANY CONTENT THAT YOU MAY DOWNLOAD OR OTHERWISE OBTAIN THROUGH THE USE OF THE SERVICE IS OBTAINED OR DOWNLOADED AT YOUR OWN RISK, AND YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR DEVICE OR LOSS OF DATA THAT RESULTS FROM SUCH DOWNLOAD OR YOUR USE OF THE SERVICE."
      },
      {
        "kind": "p",
        "text": "SAMJOEPRODUCTIONS, LLC DOES NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICE OR ANY HYPERLINKED WEBSITE OR SERVICE, AND SAMJOEPRODUCTIONS, LLC WILL NOT BE A PARTY TO OR IN ANY WAY MONITOR ANY TRANSACTION BETWEEN YOU AND THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES."
      },
      {
        "kind": "sub",
        "text": "10.2  Limitation of liability"
      },
      {
        "kind": "p",
        "text": "If the law of the country, state, or other jurisdiction where you live does not allow for the disclaimer of certain warranties provided in this Section, those disclaimers shall not apply to you to the extent prohibited.",
        "strong": true
      },
      {
        "kind": "p",
        "text": "THESE TERMS GIVE YOU SPECIFIC LEGAL RIGHTS, AND YOU MAY ALSO HAVE OTHER RIGHTS WHICH VARY FROM JURISDICTION TO JURISDICTION. THE DISCLAIMERS, EXCLUSIONS, AND LIMITATIONS OF LIABILITY UNDER THESE TERMS WILL NOT APPLY TO THE EXTENT PROHIBITED BY APPLICABLE LAW."
      },
      {
        "kind": "p",
        "text": "THIS LIMITATION OF LIABILITY SECTION APPLIES WHETHER THE ALLEGED LIABILITY IS BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER BASIS, EVEN IF SAMJOEPRODUCTIONS, LLC HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. THE LIMITATIONS OF LIABILITY IN THIS SECTION SHALL APPLY TO THE FULLEST EXTENT PERMITTED BY LAW IN THE APPLICABLE JURISDICTION."
      },
      {
        "kind": "p",
        "text": "NOTHING IN THESE TERMS SHALL AFFECT YOUR STATUTORY RIGHTS AS A CONSUMER."
      },
      {
        "kind": "p",
        "text": "NOTHING IN THESE TERMS IS INTENDED TO EXCLUDE OR LIMIT SAMJOEPRODUCTIONS, LLC'S LIABILITY FOR: (1) DEATH OR PERSONAL INJURY CAUSED BY SAMJOEPRODUCTIONS, LLC 'S GROSS NEGLIGENCE; (2) FRAUD; (3) FRAUDULENT MISREPRESENTATION; OR (4) ANY OTHER LIABILITY WHICH CANNOT BE VALIDLY EXCLUDED OR LIMITED BY LAW. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SAMJOEPRODUCTIONS, LLC, OUR OFFICERS, MANAGERS, DIRECTORS, PRINCIPALS, MEMBERS, EMPLOYEES, AGENTS, ADVISORS, EMPLOYEES, AFFILIATES, SUPPLIERS, OR LICENSORS BE LIABLE TO YOU FOR ANY LOSSES THAT WERE NOT CAUSED BY SAMJOEPRODUCTIONS, LLC'S BREACH OF THESE TERMS OR ANY LOSS OR DAMAGE ARISING OUT OF THESE TERMS THAT WAS NOT, AT THE TIME THAT YOU ACCEPTED THESE TERMS AND COMMENCED ACCESSING AND USING THE SERVICE, A REASONABLY FORESEEABLE CONSEQUENCE OF SAMJOEPRODUCTIONS, LLC'S BREACH OF THESE TERMS."
      },
      {
        "kind": "p",
        "text": "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SAMJOEPRODUCTIONS, LLC, OUR OFFICERS, MANAGERS, DIRECTORS, PRINCIPALS, MEMBERS, EMPLOYEES, AGENTS, ADVISORS, EMPLOYEES, AFFILIATES, SUPPLIERS, OR LICENSORS BE LIABLE TO YOU FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES OR FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO USE, THE SERVICE. UNDER NO CIRCUMSTANCES WILL SAMJOEPRODUCTIONS, LLC BE RESPONSIBLE FOR ANY DAMAGE, LOSS OR INJURY RESULTING FROM HACKING, TAMPERING OR OTHER UNAUTHORIZED ACCESS OR USE OF THE SERVICE OR YOUR ACCOUNT OR THE INFORMATION CONTAINED THEREIN. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SAMJOEPRODUCTIONS, LLC ASSUMES NO LIABILITY OR RESPONSIBILITY FOR ANY: (A) ERRORS, OMISSIONS, MISTAKES, OR INACCURACIES FROM THE SERVICE OR RESULTS THAT ARE OBTAINED FROM USE OF THE SERVICE; (B) PERSONAL INJURY, DEATH, OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICE (EXCEPT TO THE EXTENT CAUSED BY OUR GROSS NEGLIGENCE); (C) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN; (D) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICE; (E) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH SERVICE BY ANY THIRD PARTY; (F) ANY ERRORS OR OMISSIONS IN ANY CONTENT OR FOR ANY LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE THROUGH THE SERVICE; (G) MEMBER CONTENT, MEMBER INTERACTION, OR THE DEFAMATORY, OFFENSIVE, OR ILLEGAL CONDUCT OF ANY THIRD PARTY; AND/OR (H) ANY ACTION OR INACTION OF THIRD PARTIES. IN NO EVENT SHALL SAMJOEPRODUCTIONS, LLC, OUR OFFICERS, MANAGERS, DIRECTORS, PRINCIPALS, MEMBERS, EMPLOYEES, AGENTS, ADVISORS, EMPLOYEES, AFFILIATES, SUPPLIERS, OR LICENSORS BE LIABLE TO YOU OR ANY MEMBER FOR ANY CLAIMS, PROCEEDINGS, LIABILITIES, OBLIGATIONS, DAMAGES, LOSSES OR COSTS IN AN AMOUNT EXCEEDING THE AMOUNT YOU PAID TO SAMJOEPRODUCTIONS, LLC HEREUNDER IN THE SIX MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY."
      },
      {
        "kind": "p",
        "text": "All legal actions arising with respect to the Service shall, unless prohibited by applicable law, be barred unless written notice thereof is received by SamJoeProductions, LLC within one year from the date of the event giving rise to such legal action."
      },
      {
        "kind": "p",
        "text": "The Service is controlled and operated from facilities in the United States and may be available for use in other countries (which may change from time to time). Unless specifically stated otherwise in these Terms, SamJoeProductions, LLC makes no representations that the Service is appropriate or available for use in any country outside of the United States. Those who access or use the Service from other jurisdictions do so at their own volition and are entirely responsible for compliance with all applicable local laws and regulations."
      },
      {
        "kind": "sub",
        "text": "10.3  Jurisdictional limits"
      },
      {
        "kind": "p",
        "text": "Some jurisdictions do not allow the exclusion of certain warranties or the limitation of certain damages. In those jurisdictions, the above limitations apply only to the extent permitted by law."
      },
      {
        "kind": "h",
        "text": "11.  Indemnification"
      },
      {
        "kind": "p",
        "text": "By using the Service, you acknowledge that you have read and understood these Terms (as well as our Privacy Policy, Data Collection Notice, and Disclaimer that are expressly incorporated herein), that you use the Service at your own risk, and that you are solely responsible for decisions you make about your own diet and health. To the extent permitted by applicable law, you agree to indemnify, defend, and hold harmless SamJoeProductions, LLC, our officers, managers, directors, principals, members, employees, agents, and advisors (collectively, the “SamJoeProductions Parties”) from any and all claims, liabilities, damages, losses, costs, or debt (including but not limited to legal fees) arising from: (a) your use of the Service, including any data or content transmitted or received by you; (b) your violation of any of these Terms; (c) your violation of any rights of a third party including without limitation any right of privacy or Intellectual Property Rights; (d) your violation of any applicable law, rule or regulation; (e) any claim or damages that arise as a result of (or otherwise in connection with) any information that is submitted via your account, including any ideas; or (f) any other party’s access and use of the Service with your unique username, password, or other appropriate access code."
      },
      {
        "kind": "h",
        "text": "12.  Suspension and Termination"
      },
      {
        "kind": "p",
        "text": "You may stop using the Service and delete your account at any time through your profile settings."
      },
      {
        "kind": "p",
        "text": "We may suspend or terminate your access to the Service, with or without notice, if we reasonably believe you have violated these Terms, or if necessary to protect the Service, other users, or comply with legal obligations."
      },
      {
        "kind": "p",
        "text": "Sections relating to intellectual property, disclaimers, limitation of liability, indemnification, and dispute resolution survive termination."
      },
      {
        "kind": "h",
        "text": "13.  Changes to These Terms"
      },
      {
        "kind": "p",
        "text": "We may update these Terms from time to time. We will post the revised Terms with an updated “Last updated” date, and, where changes are material, we will provide additional notice on the opening screen of the Service and will require you to scroll through the revised Terms and click to confirm that you have reviewed and understood and that you accept same, in order for you to continue your use of the Service after any such changes take effect."
      },
      {
        "kind": "h",
        "text": "14.  Governing Law"
      },
      {
        "kind": "p",
        "text": "These Terms are governed by the laws of the State of Maryland, without regard to its conflict of laws principles."
      },
      {
        "kind": "h",
        "text": "15.  Dispute Resolution – Arbitration Agreement"
      },
      {
        "kind": "p",
        "text": "READ THIS SECTION CAREFULLY BECAUSE, EXCEPT WHERE PROHIBITED BY APPLICABLE LAW, IT REQUIRES THE PARTIES TO ARBITRATE THEIR CLAIMS. THESE DISPUTE RESOLUTION TERMS, INCLUDING ARBITRATION REQUIREMENTS AND WAIVER OF CLASS RIGHTS, APPLY TO ALL CLAIMS BETWEEN YOU AND SAMJOEPRODUCTIONS, LLC AND/OR ANY OTHER SAMJOEPRODUCTIONS PARTIES, INCLUDING WITHOUT LIMITATION CLAIMS THAT AROSE BEFORE OR AFTER YOU ACCEPTED ANY PRIOR VERSION OF THESE TERMS."
      },
      {
        "kind": "p",
        "text": "By agreeing to these Terms, you agree that you are required to resolve any and every claim and/or lawsuit that you may have against SamJoeProductions, LLC and/or any other SamJoeProductions Parties (defined in Section 11 above) solely through binding arbitration in accordance with the terms and conditions of this Section 15 (referred to herein as the “Arbitration Agreement”). Arbitration under this Agreement will take place on an individual basis only. Class arbitrations and class actions are not permitted."
      },
      {
        "kind": "p",
        "text": "Binding arbitration is a procedure in which a dispute is submitted to one or more arbitrators who make a binding decision on the dispute. Arbitration is more informal than a lawsuit in court. Arbitration uses a neutral arbitrator instead of a judge or jury and may allow for more limited discovery than in court. Unless expressly limited in this Section, arbitrators can award the same damages and relief that a court can award. In choosing binding arbitration, you and SamJoeProductions, LLC (on behalf of all SamJoeProductions Parties) are opting for a private dispute resolution procedure where you agree to accept the arbitrator’s decision as final instead of going to court. To the fullest extent permitted by law, you and the SamJoeProductions Parties are each waiving your right to a jury trial."
      },
      {
        "kind": "p",
        "text": "This Arbitration Agreement will preclude you from bringing any class, collective, coordinated, consolidated, mass, and/or representative action against the SamJoeProductions Parties, and also preclude you from participating in or recovering relief in any current or future class, collective, coordinated, consolidated, mass and/or representative action brought against any SamJoeProductions Parties by someone else—except as provided below in Section 15(a)(3)c. Thus, the parties agree that the arbitrator shall not conduct any form of class, collective, coordinated, consolidated, mass, and/or representative arbitration, nor join, coordinate, or consolidate claims of multiple individuals against the SamJoeProductions Parties in a single proceeding—except as provided below in Section 15(a)(3)c. For the avoidance of doubt, except as provided below in Section 15(a)(3)c, this Arbitration Agreement precludes you from bringing or participating in any kind of class, collective, coordinated, consolidated, mass, and/or representative or other kind of group, multi-plaintiff or joint action against any SamJoeProductions Parties, other than participating in a classwide, collective, coordinated, consolidated, mass, and/or representative settlement of claims."
      },
      {
        "kind": "ul",
        "items": [
          "Agreement to Binding Arbitration Between You and SamJoeProductions, LLC (on behalf of all SamJoeProductions Parties).",
          "Covered Disputes: You and SamJoeProductions, LLC agree that any dispute, claim, lawsuit, or controversy in any way arising between you and any SamJoeProductions Parties will be settled by binding individual arbitration between you and the applicable SamJoeProductions Parties, and not in a court of law. The only exceptions to this arbitration agreement are those expressly provided below in Section 15(b). You and SamJoeProductions, LLC mutually agree to arbitrate all disputes between you and any SamJoeProductions Parties, regardless of whether the dispute, claim, lawsuit, or controversy occurred or accrued before or after the date you agreed to these Terms, and regardless of whether you allege that the dispute, claim, or injury involves harm or injury to you or anyone else. This Arbitration Agreement survives after your relationship with SamJoeProductions, LLC and the Service ends."
        ]
      },
      {
        "kind": "p",
        "text": "For the avoidance of doubt, you and SamJoeProductions, LLC (for all SamJoeProductions Parties) mutually agree to arbitrate any disputes arising out of or relating to (i) these Terms and prior versions of these Terms, or the existence, breach, termination, enforcement, interpretation, scope, waiver, or validity thereof; (ii) your access to or use of the Services (as defined in these Terms) at any time, or a third party’s access or use of the Services at your invitation; (iii) any claimed damages for any property loss or damage or any personal injury or death to you or anyone else that you allege occurred in connection with your use of the Services or a third party’s use of the Services at your invitation; and (iv) your relationship with SamJoeProductions, LLC and the Services."
      },
      {
        "kind": "ul",
        "items": [
          "Class Action Waiver: Any and all disputes, claims, or controversies between the parties shall be resolved only in individual arbitration. The parties expressly waive the right to have any dispute, claim, lawsuit, or controversy brought, heard, administered, resolved, or arbitrated as a class, collective, coordinated, consolidated, and/or representative action, and neither an arbitrator nor an arbitration provider shall have any authority to hear, arbitrate, or administer any class, collective, coordinated, consolidated, and/or representative action, or to award relief to anyone but the individual in arbitration. The parties also expressly waive the right to seek, recover, or obtain any non-individual relief. Notwithstanding anything else in this Arbitration Agreement, this Class Action Waiver does not prevent you or any SamJoeProductions Parties from participating in a classwide, collective, and/or representative settlement of claims."
        ]
      },
      {
        "kind": "p",
        "text": "The parties further agree that if for any reason a claim does not proceed in arbitration, this Class Action Waiver shall remain in effect, and a court may not preside over any action joining, coordinating, or consolidating the claims of multiple individuals against SamJoeProductions, LLC or any other SamJoeProductions Parties in a single proceeding (other than a classwide, collective, and/or representative settlement of claims as aforesaid). If there is a final judicial determination that any portion of this Class Action Waiver is unenforceable or unlawful for any reason: (i) any class, collective, coordinated, consolidated, and/or representative claims subject to the unenforceable or unlawful portion(s) shall proceed in a court of competent jurisdiction, but any portion of any claim(s) that are subject to arbitration on an individual basis shall proceed in arbitration, and the parties agree that any remaining portions of those claim(s), as well as any other non-arbitrable claim(s), shall be stayed in court pending the completion of arbitration; (ii) the portion of the Class Action Waiver that is enforceable shall be enforced in arbitration; (iii) the unenforceable or unlawful portion(s) shall be severed from this Arbitration Agreement; and (iv) severance of the unenforceable or unlawful portion(s) shall have no impact whatsoever on the enforceability, applicability, or validity of this Arbitration Agreement or the arbitrability of any remaining claims asserted by you or any SamJoeProductions Parties. For the avoidance of doubt, the merits of a claim may be bifurcated from other portions of the claim, including remedies or requests for relief, to give maximum effect to this Arbitration Agreement and to facilitate the arbitration of any portion of any claim that may be arbitrated on an individual basis."
      },
      {
        "kind": "ul",
        "items": [
          "Mass Actions:",
          "Mass Action Waiver: Any and all disputes, claims, or controversies between the parties shall be resolved only in individual arbitration. The parties expressly waive the right to have any dispute, claim, lawsuit, or controversy brought, heard, administered, resolved, or arbitrated as a mass action, and neither an arbitrator nor an arbitration provider shall have any authority to hear, arbitrate, or administer any mass action or to award relief to anyone but the individual in arbitration—except as provided below in Section 15(a)(3)c. The parties also expressly waive the right to seek, recover, or obtain any non-individual relief. The parties agree that the definition of a “Mass Action” includes, but is not limited to, instances in which you or any SamJoeProductions Parties are represented by a law firm or collection of law firms that has filed 50 or more arbitration demands of a substantially similar nature against the other party within 180 days of the arbitration demand filed on behalf of you or any SamJoeProductions Parties. Notwithstanding anything else in this agreement, this Mass Action Waiver does not prevent you or any SamJoeProductions Parties from participating in a mass settlement of claims, as aforesaid.",
          "Dispute Procedure: Notwithstanding any provision to the contrary in the applicable arbitration provider’s rules, the arbitrator shall be empowered to determine whether the party bringing any claim has filed a Mass Action in violation of the Mass Action Waiver. Either party shall raise with the arbitrator such a dispute within 15 days of its arising. If such a dispute arises before an arbitrator has been appointed, the parties agree that (i) a panel of three arbitrators shall be appointed to resolve only disputes concerning whether the party bringing any claim has filed a Mass Action in violation of the Mass Action Waiver, with each party selecting one arbitrator from the arbitration provider’s roster to serve as a neutral arbitrator, and with the two said selected arbitrators selecting a third neutral arbitrator; provided, that if the parties’ arbitrators cannot agree on the said third arbitrator, the arbitration provider will appoint the third arbitrator; (ii) SamJoeProductions, LLC shall pay any administrative fees or costs incidental to the appointment of arbitrators under this Section 15(a)(3)b, as well as any fees or costs for the proceedigns described in this Section 15(a)(3)b that would not be incurred in a court proceeding, such as payment of the fees of the arbitrators, as well as room rental; (iii) the arbitrators shall issue a written decision with findings of fact and conclusions of law; and (iv) any further arbitration proceedings or assessment of arbitration-related fees shall be stayed pending the arbitrators’ resolution of the parties’ dispute. If the arbitrator or panel of arbitrators determines that any party has violated the Mass Action Waiver, the parties shall each have the opportunity to opt out of arbitration within thirty (30) days of the arbitrator’s or panel of arbitrators’ decision. You may opt out of arbitration by providing written notice of your intention to opt out to the arbitration provider and to SamJoeProductions, LLC, Attn: Legal Department, 10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117, via USPS Priority Mail or hand delivery. This written notice must be signed by you, and not any attorney, agent, or other representative of yours. Any SamJoeProductions Parties may opt out of arbitration by sending written notice of its or their intention to opt out to the arbitration provider and to you or your attorney, agent, or representative if you are represented. For the avoidance of doubt, the ability to opt out of arbitration described in this Section 15(a)(3)b applies only if the arbitrator or panel of arbitrators determines that a party has violated the Mass Action Waiver. If the parties proceed with arbitration, the parties agree that arbitrations will be grouped as provided in Section 15(a)(3)c below.",
          "Grouping:",
          "To increase efficiency of resolution in the event a Mass Action is filed and neither party exercises its right to opt out of arbitration pursuant to Section 15(a)(3)b above, the following procedure shall apply. At the request of either party, an arbitrator shall be selected according to the applicable arbitration provider’s rules to act as a special master (“Special Master”) to resolve threshold disputes regarding the arbitration demands submitted in the Mass Action (“Mass Arbitration Demands”). These threshold disputes may include, but are not limited to:",
          "Any dispute regarding filing fees owed with respect to the Mass Arbitration Demands, including whether claimants have submitted valid fee waivers;",
          "Any dispute regarding whether the applicable arbitration provider has complied with the Arbitration Agreement with respect to processing and administering the Mass Arbitration Demands;",
          "Any dispute regarding whether the Mass Arbitration Demands meet the requirements set forth in Section 15(d) below;",
          "Whether claimants are barred from proceeding with their claims based on a prior settlement agreement, violation of these Terms, or expiration of the statute of limitations;",
          "Any dispute relating to representation of the same claimant by multiple law firms;",
          "Any dispute regarding whether the Mass Arbitration Demands were filed with the correct arbitration provider; and",
          "Any other dispute falling within the arbitration provider’s rules providing for the resolution of threshold disputes in a mass arbitration."
        ]
      },
      {
        "kind": "p",
        "text": "Any such request shall be made within 15 days following the expiration of the opt-out period described in Section 15(a)(3)b, and may be made by providing written notice to the arbitration provider. Upon the request of either party to appoint a Special Master to resolve the foregoing issues, the applicable arbitration provider shall refrain from further processing any of the Mass Arbitration Demands to which a dispute has been raised. No further payment for filing fees, administrative costs, or arbitrator fees shall be deemed due with respect to any of the Mass Arbitration Demands as to which a dispute has been raised until after the dispute(s) has/have been resolved by the Special Master. SamJoeProductions, LLC shall be responsible for the applicable arbitration provider’s and Special Master’s fees and costs related to the proceedings before the Special Master."
      },
      {
        "kind": "p",
        "text": "A Special Master appointed pursuant to this procedure shall have no authority to consolidate cases."
      },
      {
        "kind": "ul",
        "items": [
          "After proceedings before the Special Master have concluded, to the extent any of the Mass Arbitration Demands are permitted to proceed, the parties shall organize the Mass Arbitration Demands into groups of no more than 100 demands per group by state of residence, and then alphabetically by last name (plus, to the extent there are less than 100 arbitration demands left over after the grouping described above, a final group consisting of the remaining demands), and shall inform the arbitration provider of the groups and their compositions within 14 days of the conclusion of proceedings before the Special Master. The arbitration provider shall assign each group of claims to a single arbitrator, with each group having one set of administrative documents, one set of administrative and filing fees per group, and one arbitration management conference per group. The parties agree to cooperate in good faith with each other and the arbitration provider to implement such a grouped approach to administration and fees. Regardless of the grouping described above, the arbitrator shall resolve all arbitrations within a group on an individual basis. Nothing in this provision shall be construed as limiting the right to object that the filing or presentation of multiple arbitration demands by or with the assistance of the same law firm or organization violates any term of this Agreement.",
          "If any Mass Arbitration Demands were originally processed as individual arbitration demands before this batching procedure was commenced, further proceedings, including the assessment of further arbitration filing or administration fees to either party shall be governed by the procedures set forth in this Section 15(a)(3).",
          "Delegation Agreement: Only an arbitrator, and not any federal, state, or local court or agency, shall have exclusive authority to resolve any dispute arising out of or relating to the interpretation, applicability, enforceability, or formation of this Arbitration Agreement, including without limitation any claim that all or any part of this Arbitration Agreement is void or voidable. An arbitrator shall also have exclusive authority to resolve all threshold arbitrability issues, including issues relating to whether these Terms are applicable, unconscionable, or illusory and any defense to arbitration, including without limitation waiver, delay, laches, or estoppel. However, only a court of competent jurisdiction, and not an arbitrator, shall have the exclusive authority to resolve any and all disputes concerning the Class Action Waiver and Mass Action Waiver, including, but not limited to, any claim that all or part of the Class Action Waiver and/or Mass Action Waiver is unenforceable, unconscionable, illegal, void, or voidable—except that, as stated and pursuant to the procedures provided in Section 15(a)(3)b, an arbitrator or panel of arbitrators shall have authority to determine whether the party bringing any claim has violated the Mass Action Waiver.",
          "Application to Third Parties: This Arbitration Agreement shall be binding upon, and shall include any claims brought by or against any third parties, including but not limited to your guests, spouse, domestic partner, heirs, estate, third-party beneficiaries and assigns, where their underlying claims arise out of or relate to your use of the Services or their use of the Services at your invitation. To the extent that any third-party beneficiary to this agreement brings claims against the parties to this Arbitration Agreement, those claims shall also be subject to this Arbitration Agreement. This Arbitration Agreement also applies to any claims brought by you while you are using the Services as a guest or third-party beneficiary of another user.",
          "Exceptions to Arbitration."
        ]
      },
      {
        "kind": "p",
        "text": "Notwithstanding the foregoing, this Arbitration Agreement shall not require arbitration of the following claims: (i) individual claims brought in small claims court so long as the matter remains in such court and advances only on an individual basis; and/or (ii) injunctive or other equitable relief in a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party’s copyrights, trademarks, trade secrets, patents, or other intellectual property rights."
      },
      {
        "kind": "p",
        "text": "Claims of the nature described in the preceding paragraph, but only such claims, may be brought and litigated in a court of competent jurisdiction by you on an individual basis only. On an individual basis means that you cannot bring such claims as a class, collective, coordinated, consolidated, mass, and/or representative action against any SamJoeProductions Parties. For the avoidance of doubt, this precludes you from bringing claims as or participating in any kind of any class, collective, coordinated, consolidated, mass, and/or representative or other kind of group, multi-plaintiff, or joint action against any SamJoeProductions Parties and no action brought by you may be consolidated or joined in any fashion with any other proceeding. Where your claims are brought and litigated to completion on such an individual basis in a court of competent jurisdiction, SamJoeProductions, LLC, on behalf of all SamJoeProductions Parties, agrees to honor your election."
      },
      {
        "kind": "p",
        "text": "The parties’ agreement not to require arbitration in these limited instances does not waive the enforceability of this Arbitration Agreement as to any other provision (including, but not limited to, the waivers provided for in Section 15(a), which will continue to apply in court as well as in arbitration), or the enforceability of this Arbitration Agreement as to any other lawsuit, controversy, claim, or dispute."
      },
      {
        "kind": "ul",
        "items": [
          "Rules and Governing Law."
        ]
      },
      {
        "kind": "p",
        "text": "For disputes arising in Maryland and in any other state or jurisdiction in which Judicial Arbitration and Mediation Services (“JAMS”) provides arbitration services (a “JAMS Jurisdiction”), the arbitration will be administered by JAMS in accordance with JAMS’s Arbitration Rules (the “JAMS Rules”) in effect at the time that the claim is brought, unless the parties agree otherwise in writing. The JAMS Rules are available at www.jamsadr.com/rules-comprehensive-arbitration or by searching for “JAMS Arbitration Rules” using a search engine such as www.google.com. The arbitration shall be heard by one arbitrator selected in accordance with the JAMS Rules."
      },
      {
        "kind": "p",
        "text": "For disputes arising outside of any JAMS Jurisdiction (or for disputes arising in a JAMS Jurisdiction only if JAMS cannot or will not administer the arbitration), the parties shall be required to meet and confer to select a reasonably acceptable, neutral arbitration provider that has operations in the state or other jurisdiction in which the dispute arises. If the parties are unable to mutually agree upon an arbitration provider, then either party may invoke 9 U.S.C. § 5 to request that a court of competent jurisdiction appoint an arbitration provider with operations in the state in which the dispute arises. Any arbitration provider appointed by a court under 9 U.S.C. § 5 shall conduct arbitration in accordance with this Arbitration Agreement solely on an individualized basis. Once the parties mutually agree upon a neutral arbitration provider, or an arbitrator provider is appointed under 9 U.S.C. § 5, the ensuing arbitration shall commence pursuant to the rules of the designated arbitration provider, except as designated herein. Once an arbitration provider is agreed upon or appointed, an arbitrator shall be appointed. The arbitrator will be either (1) a retired judge or (2) an attorney licensed to practice law in the state where the arbitration is conducted with experience in the law underlying the dispute. The arbitrator will be selected by the parties from the applicable arbitration provider’s roster of arbitrators. If the parties are unable to agree upon an arbitrator after a good faith meet and confer effort, then the applicable arbitration provider will appoint the arbitrator in accordance with its rules and subject to any applicable disclosure and disqualification procedures available under applicable law."
      },
      {
        "kind": "p",
        "text": "Notwithstanding any choice of law or other provision in these Terms, the parties agree and acknowledge that this Arbitration Agreement evidences a transaction involving interstate commerce and that the Federal Arbitration Act, 9 U.S.C. § 1, et seq. (“FAA”), will govern its interpretation and enforcement and proceedings pursuant thereto. It is the intent of the parties to be bound by the provisions of the FAA for all purposes, including, but not limited to, interpretation, implementation, enforcement, and administration of this Arbitration Agreement, and that the FAA and the applicable arbitration provider’s rules shall preempt all state laws to the fullest extent permitted by law. All statutes of limitations that would otherwise be applicable will apply to any arbitration proceeding. If the FAA and applicable arbitration provider’s rules are found to not apply to any issue regarding the interpretation or enforcement of this Arbitration Agreement, then that issue shall be resolved under the laws of the state where you reside when you accept these Terms, without regard to choice or conflict of laws principles."
      },
      {
        "kind": "p",
        "text": "Any dispute, claim, lawsuit, or controversy arising out of or relating to incidents or accidents resulting in personal injury (including but not limited to sexual assault or harassment claims) or death that you allege occurred in connection with your use of the Services, whether before or after the date you agreed to the Terms, shall be governed by and construed in accordance with the laws of the state in which the incident or accident occurred, without regard to choice or conflict of laws principles."
      },
      {
        "kind": "ul",
        "items": [
          "Process."
        ]
      },
      {
        "kind": "p",
        "text": "Pre-Arbitration Dispute Resolution and Notification. The parties agree that good-faith informal efforts to resolve disputes often can result in a prompt, low-cost, and mutually beneficial outcome. The parties therefore agree that, before either party demands arbitration against the other, you and SamJoeProductions, LLC, and/or other SamJoeProductions Parties will personally meet and confer, via telephone or videoconference, in a good-faith effort to resolve informally any claim covered by this Arbitration Agreement. Multiple individuals initiating claims cannot participate in the same informal telephonic dispute resolution conference. Unless the parties agree otherwise in writing, if either party is represented by counsel, that party’s counsel may participate in the conference, but the party must also appear at and fully participate in the conference. The party initiating the claim must give notice to the other party in writing of their intent to initiate an informal dispute resolution conference, which shall occur within 60 days after the other party receives such notice, unless an extension is mutually agreed upon by the parties. To notify SamJoeProductions, LLC that you intend to initiate an informal dispute resolution conference, write to SamJoeProductions, LLC, Attn: Legal Department, 10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117, providing your name, the telephone number(s) and email address(es) associated with your FORKTHIS!™  account (if any), and a description of your claim. If SamJoeProductions, LLC intends to initiate an informal dispute resolution conference, it will send notice, including a description of its claim, to you via electronic email to the email address associated with your FORKTHIS!™  account. Engaging in an informal dispute resolution conference is a condition precedent that must be fulfilled before commencing arbitration, and the arbitrator shall dismiss any arbitration demand filed before completion of an informal dispute resolution conference. The statute of limitations and any filing fee deadlines shall be tolled while the parties engage in the informal dispute resolution process required by this paragraph."
      },
      {
        "kind": "p",
        "text": "Initiating Arbitration. In order to initiate arbitration following the conclusion of the informal dispute resolution process required by this Section, a party must provide the other party with a written demand for arbitration and file the demand with the applicable arbitration provider, as determined by Section 15(c). A party initiating an arbitration against SamJoeProductions, LLC and/or other SamJoeProductions Parties must send the written demand for arbitration to SamJoeProductions, LLC, Attn: Legal Department, 10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117, or serve the Demand on SamJoeProductions, LLC’s resident agent for service of process, as stated on the State of Maryland Department of Assessments and Taxation website, https://egov.maryland.gov/BusinessExpress/. Additionally, a party initiating arbitration against SamJoeProductions, LLC and/or other SamJoeProductions Parties must send an electronic version of the demand for arbitration to the Arbitration Provider, and must send an electronic version of the as-filed demand to SamJoeProductions, LLC at admin@forkthisapp.com. If SamJoeProductions, LLC or any other SamJoeProductions Parties initiates arbitration against you, it must send the written demand for arbitration to you via electronic email to the email address associated with your FORKTHIS!™ account."
      },
      {
        "kind": "p",
        "text": "By signing the demand for arbitration, you agree to take reasonable steps to ensure that counsel certifies to the best of counsel’s knowledge, information, and belief, formed after an inquiry reasonable under the circumstances, that (i) the demand for arbitration is not being presented for any improper purpose, such as to harass, cause unnecessary delay, or needlessly increase the cost of dispute resolution; (ii) the claims and other legal contentions are warranted by existing law or by a nonfrivolous argument for extending, modifying, or reversing existing law or for establishing new law; and (iii) the factual contentions have evidentiary support or, if specifically so identified, will likely have evidentiary support after a reasonable opportunity for further investigation or discovery. The arbitrator shall be authorized to afford any relief or impose any sanctions available under Federal Rules of Civil Procedure 11 or any applicable state law for either party’s violation of this requirement."
      },
      {
        "kind": "ul",
        "items": [
          "Location."
        ]
      },
      {
        "kind": "p",
        "text": "Unless we and you both agree otherwise, or the applicable arbitration rules dictate otherwise, if you reside in the United States, any arbitration hearing involving a claim seeking (on a good faith and plausible factual basis) damages in an amount not exceeding $45,000 will be conducted via videoconference, although the parties shall each have the option, at their sole cost and expense (wehich shall not be recoverable in any award), to attend the arbitration hearing live. Moreover, the arbitrator shall have the reasonable discretion, based on the nature and complexity of the case, to conduct the arbitration hearing via videoconference for claims exceeding the damages amount stated in the preceding sentence. In all other cases, the arbitration will be conducted in the county where you reside. If you do not reside in the United States, the arbitration will be conducted in the country where the dispute arises, and will be conducted via videoconference only and conducted only in English. Your right to a hearing will be determined by the applicable arbitration provider’s rules. Subject to the applicable arbitration provider’s rules, the arbitrator will have the discretion to direct a reasonable exchange of information by the parties, consistent with the expedited nature of the arbitration."
      },
      {
        "kind": "ul",
        "items": [
          "Offers of Judgment."
        ]
      },
      {
        "kind": "p",
        "text": "At least 10 days before the date set for the arbitration hearing, any party may serve an offer in writing upon the other party to allow judgment on specified terms. If the offer is accepted, the offer with proof of acceptance shall be submitted to the arbitrator, who shall enter judgment accordingly. If the offer is not accepted prior to the arbitration hearing or within 30 days after it is made, whichever occurs first, it shall be deemed withdrawn, and cannot be given in evidence upon the arbitration. If an offer made by one party is not accepted by the other party, and the other party fails to obtain a more favorable award, the other party shall not recover their post-offer costs and shall pay the offering party’s costs from the time of the offer notwithstanding the withdrawal of the offer."
      },
      {
        "kind": "ul",
        "items": [
          "Arbitrator’s Decision."
        ]
      },
      {
        "kind": "p",
        "text": "The arbitrator will render an award within the time frame specified in the applicable arbitration provider’s rules. Judgment on the arbitration award may be entered in any court of competent jurisdiction. Except as to claims for public injunctive relief where required by law, the arbitrator may award declaratory or injunctive relief only in favor of a party and only to the extent necessary to provide relief warranted by the party’s individual claim. An arbitrator’s decision shall be final and binding on all parties."
      },
      {
        "kind": "p",
        "text": "The arbitrator is not bound by decisions reached in separate arbitrations, and the arbitrator’s decision shall be binding only upon the parties to the arbitration that are the subject of the decision."
      },
      {
        "kind": "p",
        "text": "The arbitrator may award reasonable costs incurred in the arbitration to the prevailing party in accordance with the law(s) of the state in which arbitration is held."
      },
      {
        "kind": "ul",
        "items": [
          "Fees."
        ]
      },
      {
        "kind": "p",
        "text": "With the exception of the provisions governing payment of arbitration costs set forth above, your responsibility to pay any filing, administrative, and arbitrator fees will be solely as set forth in the applicable arbitration provider’s rules and shall be up to the amount you would be required to pay if you filed a claim in court."
      },
      {
        "kind": "p",
        "text": "If you have a gross monthly income of less than 300% of the federal poverty guidelines, you are entitled to a waiver of arbitration fees and costs, exclusive of arbitrator fees."
      },
      {
        "kind": "p",
        "text": "Any and all disputes regarding a party’s obligation to pay any arbitration fees or costs that arise after an arbitrator is appointed shall be determined solely by the arbitrator. If such a dispute arises before an arbitrator has been appointed, and if no Special Master has been requested by either party pursuant to Section 15(a)(3)c.i of these Terms, the parties agree that (i) the due date for any disputed fees shall be stayed pending resolution of the parties’ dispute, (ii) a panel of three arbitrators shall be appointed to resolve the parties’ dispute concerning a party’s obligation to pay fees or costs of arbitration, (iii) the panel of arbitrators shall be appointed by each party selecting one arbitrator from the arbitration provider’s roster to serve as neutral arbitrators, and these arbitrators shall appoint a third neutral arbitrator. If the parties’ arbitrators cannot agree on a third arbitrator, the arbitration administrator will select the third arbitrator, (iv) SamJoeProductions, LLC shall pay any administrative fees or costs incidental to the appointment of a panel of arbitrators under this provision, as well as any fees or costs that would not be incurred in a court proceeding, such as payment of the fees of the arbitrator(s), as well as room rental, and (v) the arbitrator(s) shall issue a written decision with findings of fact and conclusions of law. If two or more fee disputes between a claimant and SamJoeProductions, LLC and/or other SamJoeProductions Parties arise at or around the same time, the disputes may be consolidated for resolution by a single arbitrator or panel of arbitrators either at the agreement of the parties or the election of the party common to all such disputes."
      },
      {
        "kind": "ul",
        "items": [
          "Severability and Survival."
        ]
      },
      {
        "kind": "p",
        "text": "If any portion of this Arbitration Agreement is found to be unenforceable or unlawful for any reason, (i) the unenforceable or unlawful provision shall be severed from these Terms; (ii) severance of the unenforceable or unlawful provision shall have no impact whatsoever on the remainder of the Arbitration Agreement or the parties’ ability to compel arbitration of any remaining claims on an individual basis pursuant to the Arbitration Agreement; and (iii) to the extent that any claims must therefore proceed on a class, collective, consolidated, or representative basis, such claims must be litigated in a civil court of competent jurisdiction and not in arbitration, but any portion of any claim(s) that are subject to arbitration on an individual basis shall proceed in arbitration and the parties agree that any remaining portions of those claim(s), as well as any other non-arbitrable claim(s), shall be stayed in court pending the completion of arbitration. For the avoidance of doubt, the merits of a claim may be bifurcated from other portions of the claim, including remedies or requests for relief, to give maximum effect to this Arbitration Agreement and to facilitate the arbitration of any portion of any claim that may be arbitrated on an individual basis."
      },
      {
        "kind": "ul",
        "items": [
          "Stay of Litigation Pending Appeal."
        ]
      },
      {
        "kind": "p",
        "text": "The parties agree that, in the event of any appeal from a court’s denial of a motion to compel arbitration under the Arbitration Agreement, all litigation of the claims at issue in the appeal will be stayed pending resolution of the appeal. The parties agree that such a stay avoids prejudice to both parties arising from the unnecessary and duplicative expenditure of resources in litigating claims that may be sent to arbitration."
      },
      {
        "kind": "h",
        "text": "16.  General"
      },
      {
        "kind": "ul",
        "items": [
          "Entire Agreement: these Terms, together with the Privacy Policy, Data Collection Notice, and Disclaimer, constitute the entire agreement between you and us regarding the Service.",
          "Severability: if any provision of these Terms is held by any tribunal of competent jurisdiction to be invalid or legally unenforceable, the remaining provisions shall remain valid and in full force. Moreover, upon any such finding, the provision in question shall be deemed automatically amended to the minimum extent needed to make it valid and enforceable.",
          "No waiver: our failure to enforce any provision does not constitute a waiver of that provision.",
          "Assignment: you may not assign these Terms to any other person or entity. We may assign them in connection with any business merger, acquisition, or sale of assets transacted between SamJoeProductions, LLC and any other person or entity.",
          "Apple and Google terms: where you access the Service through a mobile application, additional terms required by the applicable app store may apply. You are solely responsible for reading, understanding, and complying with any such additional terms of such app store."
        ]
      },
      {
        "kind": "h",
        "text": "17.  Contact"
      },
      {
        "kind": "p",
        "text": "Questions about these Terms may be directed to:"
      },
      {
        "kind": "table",
        "head": [
          "Entity",
          "SamJoeProductions, LLC"
        ],
        "rows": [
          [
            "Email",
            "admin@forkthisapp.com"
          ],
          [
            "Address",
            "10075 Red Run Boulevard, 4th Floor, Owings Mills, MD 21117"
          ]
        ]
      }
    ],
  },
};
