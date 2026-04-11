(() => {
  async function load(product) {
    const response = await fetch(`/api/license?product=${encodeURIComponent(product)}`, {
      credentials: "include",
    });
    if (!response.ok) return { active: false, product };
    return response.json();
  }

  window.YoheLabAccess = {
    load,
  };
})();
