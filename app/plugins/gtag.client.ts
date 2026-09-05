export default defineNuxtPlugin(() => {
  useHead({
    script: [
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=GT-TNC4SKVD',
        async: true,
      },
      {
        key: 'gtag-init',
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag("set","linker",{"domains":["tailorboost.com"]});
          gtag("js", new Date());
          gtag("set", "developer_id.dZTNiMT", true);
          gtag("config", "GT-TNC4SKVD");
        `.trim(),
      },
    ],
  })
})
