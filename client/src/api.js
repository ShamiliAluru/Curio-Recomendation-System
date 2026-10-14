const API = `${import.meta.env.VITE_API_URL || ''}/api`;
async function request(path, options={}) {
  const response = await fetch(`${API}${path}`, { headers:{'Content-Type':'application/json'}, ...options });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
export const getDashboard = () => request('/dashboard');
export const getItems = (search='', category='All') => request(`/items?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
export const recordActivity = (itemId,type) => request('/activity',{method:'POST',body:JSON.stringify({itemId,type})});
