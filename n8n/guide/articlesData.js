window.n8nArticles = [
  {
    "id": "what-is-n8n",
    "title": "What is n8n?",
    "tags": ["Overview", "Automation", "Open Source"],
    "description": "A complete introduction to n8n — the open-source workflow automation platform. Learn what it is, what it can do, who it's for, and how to get started.",
    "date": "2026-03-29",
    "author": "Anshul Namdev",
    "url": "/n8n/guide/what-is-n8n/"
  },
  {
    "id": "build-your-first-workflow",
    "title": "How to Build Your First n8n Workflow",
    "tags": ["Beginner", "Workflows", "Getting Started"],
    "description": "A practical roadmap for building your first n8n workflow. From getting set up, to completing the official courses, to solving real problems with automation.",
    "date": "2026-03-29",
    "author": "Anshul Namdev",
    "url": "/n8n/guide/build-your-first-workflow/"
  },
  {
    "id": "webhooks-auth",
    "title": "Handling Custom Headers & Webhook Auth",
    "tags": ["Webhooks", "APIs", "Security"],
    "description": "Secure your workflows against unverified payloads. Learn how to explicitly extract webhook headers and validate cryptographic signatures using internal Crypto nodes.",
    "date": "2026-03-18",
    "author": "Anshul Namdev",
    "content": "<h2>Why Verify Webhooks?</h2><p>When exposing an n8n webhook URL to the public web, anyone with the URL can trigger your workflow. To ensure data integrity—especially for sensitive platforms like Stripe, GitHub, or Shopify—you must verify the cryptographic signature sent in the request headers.</p><h2>The Solution</h2><p>Stop trusting raw payloads. Validate signatures using n8n's Crypto node.</p><h3>Implementation Guide</h3><ol><li><strong>Enable Headers:</strong> Inside your Webhook node, map to the Options block and enable <strong>Include Headers</strong>. This allows n8n to output the header alongside the body.</li><li><strong>Calculate the Hash:</strong> Use a <strong>Crypto</strong> node. Set the Action to <em>Hash</em>, select the appropriate algorithm (e.g., HMAC SHA256), input your webhook secret, and use the raw webhook body as the value.</li><li><strong>Compare Hashes:</strong> Use an <strong>If</strong> node to compare the output of your Crypto node's hash with the signature provided in the headers (e.g., <code>headers['stripe-signature']</code>).</li></ol><p>If the expressions match, process the workflow as normal. If they fail, route to an HTTP response node emitting a 401 Unauthorized.</p>"
  },
  {
    "id": "error-trigger",
    "title": "Building Resilient Workflows: The Error Trigger",
    "tags": ["Architecture", "Error Handling", "Advanced"],
    "description": "Stop silent failures. Implement master-level error handling workflows that catch API limits and data malformations, routing exact failure context directly to Slack.",
    "date": "2026-03-15",
    "author": "Anshul Namdev",
    "content": "<h2>The Danger of Silent Failures</h2><p>As workflows scale, the likelihood of a third-party API timeout or an unexpected data malformation increases. If you rely purely on checking the n8n execution UI, you are reacting too slowly to critical pipeline failures.</p><h2>Architecting an Error Handling Flow</h2><p>Instead of placing Try/Catch logic continuously throughout complex workflows, n8n allows for global Error Workflows.</p><h3>How to implement:</h3><ol><li>Create a brand new workflow and name it something like \"Global Error Handler\".</li><li>Add the <strong>Error Trigger</strong> node as its starting node. This node catches execution states when other workflows fail.</li><li>In this workflow, connect the Error Trigger to a Slack, Discord, or Email node.</li><li>Format the failure message beautifully using expressions: <br><code>Workflow: {{$json.workflow.name}}</code> <br><code>Failed Node: {{$json.execution.lastNodeExecuted}}</code> <br><code>Error: {{$json.execution.error.message}}</code></li></ol><h3>Activating the Handler</h3><p>In your main automation workflows, open the workflow <strong>Settings</strong> and set the Error Workflow property to your newly built \"Global Error Handler\". Now, any unhandled failure instantly pings your engineering channel.</p>"
  }
];
