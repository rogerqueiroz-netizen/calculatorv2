// Config geral: segmentação, preços, custos e margens

export const segmentation = {
  groups: [
    { id: 1, name: "Group 1", label: "≤ P50 (≤ 622 cards)", min: 0, max: 622 },
    { id: 2, name: "Group 2", label: "P50–P75 (623–1,842 cards)", min: 623, max: 1842 },
    { id: 3, name: "Group 3", label: "P75–P90 (1,843–5,378 cards)", min: 1843, max: 5378 },
    { id: 4, name: "Group 4", label: "> P90 (> 5,378 cards)", min: 5379, max: Infinity },
  ],
  suggestions: {
    1: { Basic:{ aj:4.80, integrations:0.00 }, Mid:{ aj:10.37, integrations:2.67 }, Advanced:{ aj:19.82, integrations:25.83 } },
    2: { Basic:{ aj:3.77, integrations:0.39 }, Mid:{ aj:8.45, integrations:7.21 }, Advanced:{ aj:17.12, integrations:42.82 } },
    3: { Basic:{ aj:4.88, integrations:2.26 }, Mid:{ aj:10.17, integrations:13.77 }, Advanced:{ aj:19.23, integrations:69.84 } },
    4: { Basic:{ aj:6.72, integrations:6.18 }, Mid:{ aj:17.34, integrations:28.94 }, Advanced:{ aj:33.93, integrations:84.77 } },
  }
};

// arredonda sugestões para baixo (critério que você pediu)
Object.values(segmentation.suggestions).forEach(g => {
  Object.values(g).forEach(rec => {
    rec.aj = Math.floor(rec.aj);
    rec.integrations = Math.floor(rec.integrations);
  });
});

export const pricing = {
  license: {
    "Enterprise License": 40.00,
    "Enterprise License - Annual pmt": 38.08,
    "Enterprise Plus": 107.00,
    "Enterprise Plus - Annual pmt": 93.25,
  },
  automationJobs: {
    "Automation Jobs - 500": { price: 27.00, units: 500 },
    "Automation Jobs - 1K":  { price: 51.00, units: 1000 },
    "Automation Jobs - 10K": { price: 339.00, units: 10000 },
    "Automation Jobs - 50K": { price: 1133.00, units: 50000 },
  },
  apiCalls: {
    "Api Calls - 1K":  { price: 27.00, units: 1000 },
    "Api Calls - 10K": { price: 78.00, units: 10000 },
  },
  customIntegrations: {
    "Custom Integrations 500":  { price: 42.00,   units: 500 },
    "Custom Integrations 1K":   { price: 84.00,   units: 1000 },
    "Custom Integrations 5K":   { price: 338.00,  units: 5000 },
    "Custom Integrations 10K":  { price: 531.00,  units: 10000 },
    "Custom Integrations 20K":  { price: 928.00,  units: 20000 },
    "Custom Integrations 40K":  { price: 1643.00, units: 40000 },
    "Custom Integrations 60K":  { price: 2289.00, units: 60000 },
    "Custom Integrations 80K":  { price: 2890.00, units: 80000 },
    "Custom Integrations 100K": { price: 3392.00, units: 100000 },
    "Custom Integrations 250K": { price: 7817.00, units: 250000 },
    "Custom Integrations 1M":   { price: 9540.00, units: 1000000 },
  },
  aiCredits: {
    "AI Credits 500":  { price: 159.00,  units: 500 },
    "AI Credits 1K":   { price: 212.00,  units: 1000 },
    "AI Credits 10K":  { price: 1590.00, units: 10000 },
    "AI Credits 50K":  { price: 5300.00, units: 50000 },
  },
  pipesign: {
    "Pipesign 500":  { price: 305.00,  units: 500 },
    "Pipesign 1K":   { price: 570.00,  units: 1000 },
    "Pipesign 10K":  { price: 5300.00, units: 10000 },
    "Pipesign 50K":  { price: 25000.00, units: 50000 },
  },
  included: {
    automationJobs: 2000,
    apiCalls: 10000,
  }
};

export const variableCosts = {
  automationJobs: 0.0005,
  apiCalls: 0.0004,
  customIntegrations: 0.0005,
  aiCredits: 0.0075,
  pipesign: 0.0
};

export const fixedCosts = { csm: 400, support: 25 };

// tiers de margem mínima
export const marginTiers = [
  { maxMrr: 2000,   requiredMargin: 0.90 },
  { maxMrr: 5000,   requiredMargin: 0.85 },
  { maxMrr: 10000,  requiredMargin: 0.80 },
  { maxMrr: Infinity, requiredMargin: 0.75 },
];
