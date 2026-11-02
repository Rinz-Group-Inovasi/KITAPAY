'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { API_BASE_URL } from '@/lib/api';

// Simple Icons
import { SiJavascript, SiJson, SiCurl } from 'react-icons/si';
import { Check, Copy } from '@phosphor-icons/react';
import AES256Seal from '@/components/AES256Seal';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const LANGUAGE_ICONS: Record<string, React.ReactNode> = {
  javascript: <SiJavascript className="w-3.5 h-3.5 text-[#F7DF1E]" />,
  node: <SiJavascript className="w-3.5 h-3.5 text-[#43853D]" />,
  json: <SiJson className="w-3.5 h-3.5 text-slate-400" />,
  curl: <SiCurl className="w-4 h-4 text-slate-300" />
};

function CodeBlock({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Icon = LANGUAGE_ICONS[language] || null;

  return (
    <div className="rounded-xl overflow-hidden border border-[#2d2d2d] bg-[#0d0d0d] shadow-2xl font-mono text-sm group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2d2d2d]">
        <div className="flex items-center gap-2">
          {Icon}
          <span className="text-xs font-medium text-slate-300">{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check weight="bold" className="w-4 h-4 text-emerald-400" /> : <Copy weight="duotone" className="w-4 h-4" />}
        </button>
      </div>
      {/* Code */}
      <div className="text-[13px] leading-relaxed max-h-125 overflow-y-auto custom-scrollbar">
        <SyntaxHighlighter
          language={language === 'node' ? 'javascript' : language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            background: 'transparent',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function CodeTabs({ tabs }: { tabs: { id: string; label: string; language: string; code: string; }[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeContent = tabs.find(t => t.id === activeTab);

  return (
    <div className="rounded-xl overflow-hidden border border-[#2d2d2d] bg-[#0d0d0d] shadow-2xl font-mono text-sm">
      {/* Tabs Header */}
      <div className="flex items-center bg-[#1a1a1a] border-b border-[#2d2d2d] px-2 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-white text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Code Area */}
      <div className="relative group">
        <button
          onClick={() => {
            if (activeContent) {
              navigator.clipboard.writeText(activeContent.code);
            }
          }}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Copy weight="duotone" className="w-4 h-4" />
        </button>
        <div className="text-[13px] leading-relaxed max-h-125 overflow-y-auto custom-scrollbar">
          <SyntaxHighlighter
            language={activeContent?.language === 'node' ? 'javascript' : activeContent?.language || 'json'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent' }}
          >
            {activeContent?.code || ''}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-360 mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 sm:border-r border-slate-200">
            <img src="/KitaPay Emblem.png" alt="KitaPay Emblem" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
            <Link href="/pricing" className="text-slate-500 hover:text-slate-900 transition-colors">Biaya</Link>
            <Link href="/docs" className="text-slate-900 transition-colors">Panduan</Link>
            <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors">Daftar/Login</Link>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-360 mx-auto flex items-start">
        {/* LEFT SIDEBAR (Sticky Navigation) */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-16.25 h-[calc(100vh-65px)] overflow-y-auto py-10 px-6 border-r border-slate-200">
          <nav className="space-y-8 text-sm">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 px-2">Getting Started</h4>
              <ul className="space-y-1">
                <li><button onClick={() => scrollTo('introduction')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Introduction</button></li>
                <li><button onClick={() => scrollTo('authentication')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Authentication</button></li>
                <li><button onClick={() => scrollTo('errors')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Errors</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 px-2">Payments API</h4>
              <ul className="space-y-1">
                <li><button onClick={() => scrollTo('create-payment')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Create Payment</button></li>
                <li><button onClick={() => scrollTo('get-payment')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Retrieve Payment</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 px-2">Frontend & Webhooks</h4>
              <ul className="space-y-1">
                <li><button onClick={() => scrollTo('snap-ui')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Snap UI Integration</button></li>
                <li><button onClick={() => scrollTo('webhooks')} className="block w-full text-left px-2 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">Webhooks</button></li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTENT (Middle + Right) */}
        <main className="flex-1 min-w-0 py-12 px-6 lg:px-12 xl:px-16 overflow-y-auto">
          
          {/* SECTION: INTRODUCTION */}
          <section id="introduction" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 border-b border-slate-100 pb-24">
            <div className="prose prose-slate max-w-none">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-6">Introduction</h1>
              <p className="text-slate-600 leading-relaxed">
                The KitaPay API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You can use the KitaPay API in test mode, which does not affect your live data or interact with the banking networks. The API key you use to authenticate the request determines whether the request is live mode or test mode.
              </p>
            </div>
            <div className="xl:sticky xl:top-25 h-fit">
              <CodeBlock 
                language="curl" 
                title="Base URL" 
                code={`https://apikita.rinzgroup.web.id/v1`} 
              />
            </div>
          </section>

          {/* SECTION: AUTHENTICATION */}
          <section id="authentication" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 border-b border-slate-100 pb-24">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">Authentication</h2>
              <p className="text-slate-600 leading-relaxed">
                The KitaPay API uses API keys to authenticate requests. You can view and manage your API keys in the KitaPay Dashboard.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Authentication to the API is performed via HTTP Bearer Auth. Provide your API key as the bearer token value.
              </p>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm my-6">
                <strong>Important:</strong> Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
              </div>

              {/* AES-256 Cryptographic Standard Note */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-6 flex items-center gap-4">
                <AES256Seal size={44} className="w-11 h-11 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    Standar Kriptografi AES 256
                  </div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Kredensial API dan data sensitif dienkripsi menggunakan standar enkripsi simetris <strong>AES-256</strong> dan ditransmisikan melalui protokol aman HTTPS.
                  </p>
                </div>
              </div>
            </div>
            <div className="xl:sticky xl:top-25 h-fit space-y-6">
              <CodeBlock 
                language="curl" 
                title="Authentication Header" 
                code={`Authorization: Bearer sk_test_your_secret_key`} 
              />
            </div>
          </section>

          {/* SECTION: ERRORS */}
          <section id="errors" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 border-b border-slate-100 pb-24">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">Errors</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                KitaPay uses conventional HTTP response codes to indicate the success or failure of an API request.
              </p>
              <div className="not-prose">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 font-mono font-medium text-slate-900 w-24">2xx</td>
                      <td className="py-3 text-slate-600">Indicates success.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium text-slate-900 w-24">400</td>
                      <td className="py-3 text-slate-600">Bad Request. The request was unacceptable, often due to missing a required parameter.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium text-slate-900 w-24">401</td>
                      <td className="py-3 text-slate-600">Unauthorized. No valid API key provided.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium text-slate-900 w-24">404</td>
                      <td className="py-3 text-slate-600">Not Found. The requested resource doesn't exist.</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono font-medium text-slate-900 w-24">5xx</td>
                      <td className="py-3 text-slate-600">Server errors. Something went wrong on KitaPay's end.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="xl:sticky xl:top-25 h-fit">
              <CodeBlock 
                language="json" 
                title="Error Response Example" 
                code={`{
  "success": false,
  "error": {
    "code": "invalid_request_error",
    "message": "The amount must be greater than 10000",
    "param": "amount"
  }
}`} 
              />
            </div>
          </section>

          {/* SECTION: CREATE PAYMENT */}
          <section id="create-payment" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 border-b border-slate-100 pb-24">
            <div className="prose prose-slate max-w-none">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 m-0">Create Payment</h2>
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700">POST</span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-8">
                Creates a new payment transaction. This endpoint generates a QRIS string or payment link depending on your configuration.
              </p>
              
              <h3 className="text-sm font-bold tracking-wide text-slate-900 uppercase border-b border-slate-200 pb-2 mb-6">Body Parameters</h3>
              
              <div className="space-y-8 not-prose">
                <div className="border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-slate-900">merchantId</code>
                    <span className="text-xs text-red-500 font-medium">required</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-2">string (UUID)</div>
                  <p className="text-sm text-slate-600 leading-relaxed">The unique identifier of your merchant account, available in your dashboard.</p>
                </div>

                <div className="border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-slate-900">amount</code>
                    <span className="text-xs text-red-500 font-medium">required</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-2">integer</div>
                  <p className="text-sm text-slate-600 leading-relaxed">The amount intended to be collected by this payment. Must be a positive integer in IDR.</p>
                </div>

                <div className="border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-slate-900">externalId</code>
                    <span className="text-xs text-red-500 font-medium">required</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-2">string</div>
                  <p className="text-sm text-slate-600 leading-relaxed">A unique string referencing this payment in your own system. Prevents duplicate payments.</p>
                </div>

                <div className="border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-slate-900">targetWebhookUrl</code>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-2">string (URL)</div>
                  <p className="text-sm text-slate-600 leading-relaxed">The URL where KitaPay will send a POST request when the payment status changes (e.g. successfully paid).</p>
                </div>
              </div>
            </div>

            <div className="xl:sticky xl:top-25 h-fit space-y-6">
              <CodeTabs 
                tabs={[
                  {
                    id: 'curl',
                    label: 'cURL',
                    language: 'curl',
                    code: `curl -X POST https://apikita.rinzgroup.web.id/v1/payments \\
  -H "Authorization: Bearer sk_test_your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchantId": "b3f0-4567-89ab",
    "amount": 150000,
    "externalId": "ORDER-12345",
    "targetWebhookUrl": "https://api.yoursite.com/webhook"
  }'`
                  },
                  {
                    id: 'node',
                    label: 'Node.js',
                    language: 'node',
                    code: `import fetch from 'node-fetch';

const response = await fetch('https://apikita.rinzgroup.web.id/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_your_secret_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    merchantId: 'b3f0-4567-89ab',
    amount: 150000,
    externalId: 'ORDER-12345',
    targetWebhookUrl: 'https://api.yoursite.com/webhook'
  })
});

const data = await response.json();`
                  }
                ]}
              />

              <CodeBlock 
                language="json" 
                title="Response"
                code={`{
  "success": true,
  "transaction": {
    "id": "kp_txn_9a8b7c6d",
    "external_id": "ORDER-12345",
    "amount": 150000,
    "status": "PENDING",
    "qris_string": "00020101021126660016...",
    "expires_at": "2026-08-30T18:00:00Z"
  }
}`}
              />
              <div className="mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-2">Response Data Types</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>success</code> <span className="text-xs font-mono text-slate-400 mx-2">boolean</span> Indicates if the request was successful.</li>
                  <li><code>transaction.id</code> <span className="text-xs font-mono text-slate-400 mx-2">string</span> The unique KitaPay transaction identifier.</li>
                  <li><code>transaction.external_id</code> <span className="text-xs font-mono text-slate-400 mx-2">string</span> Your system's reference ID.</li>
                  <li><code>transaction.amount</code> <span className="text-xs font-mono text-slate-400 mx-2">integer</span> The payment amount in IDR.</li>
                  <li><code>transaction.status</code> <span className="text-xs font-mono text-slate-400 mx-2">string</span> Current status (e.g. <code>PENDING</code>, <code>PAID</code>).</li>
                  <li><code>transaction.qris_string</code> <span className="text-xs font-mono text-slate-400 mx-2">string</span> The raw QRIS string for generating a QR code (if applicable).</li>
                  <li><code>transaction.expires_at</code> <span className="text-xs font-mono text-slate-400 mx-2">string (ISO 8601)</span> The timestamp when the payment expires.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION: SNAP UI */}
          <section id="snap-ui" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 border-b border-slate-100 pb-24">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">Snap UI Integration</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Once a payment is created via the backend API, you can display the KitaPay Snap UI to your customers. It's a ready-to-use checkout interface that securely handles the QRIS display and status polling.
              </p>
              
              <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Opening the Snap Popup</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                In your frontend (React, Vue, or Vanilla JS), simply open a popup window pointing to the Snap URL using the <code>transaction.id</code> you received from the Create Payment API.
              </p>

              <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Listening for Success Events</h3>
              <p className="text-slate-600 leading-relaxed">
                The Snap window will communicate back to your main window via the browser's <code>postMessage</code> API when a payment succeeds.
              </p>
            </div>
            <div className="xl:sticky xl:top-25 h-fit space-y-6">
              <CodeBlock 
                language="javascript" 
                title="Frontend Javascript"
                code={`// 1. Open Snap UI Popup
const transactionId = "kp_txn_9a8b7c6d"; // From your backend
const snapUrl = \`https://app.kitapay.rinzgroup.web.id/snap/\${transactionId}\`;

window.open(snapUrl, "KitaPaySnap", "width=400,height=650");

// 2. Listen for completion
window.addEventListener("message", (event) => {
  // Always verify origin in production
  if (event.origin !== "https://app.kitapay.rinzgroup.web.id") return;

  try {
    const data = JSON.parse(event.data);
    if (data.type === 'KITAPAY_SNAP_SUCCESS') {
      console.log('Payment Successful!', data.payload);
      // Update your UI to show success state
    }
  } catch(e) {}
});`}
              />
            </div>
          </section>

          {/* SECTION: WEBHOOKS */}
          <section id="webhooks" className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12 xl:gap-20 mb-24 pb-24">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-6">Webhooks</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Webhooks allow you to build or set up integrations which subscribe to certain events on KitaPay. When one of those events is triggered, we'll send a HTTP POST payload to the webhook's configured URL.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You must always rely on Webhooks to update the order status in your database, as frontend callbacks (like Snap UI postMessage) can be manipulated or interrupted if the user closes their browser early.
              </p>
            </div>
            <div className="xl:sticky xl:top-25 h-fit">
              <CodeBlock 
                language="json" 
                title="Webhook Payload Example"
                code={`// POST https://api.yoursite.com/webhook
{
  "event": "payment.success",
  "data": {
    "transaction_id": "kp_txn_9a8b7c6d",
    "external_id": "ORDER-12345",
    "amount": 150000,
    "status": "PAID",
    "paid_at": "2026-08-30T18:05:12Z"
  }
}`}
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
