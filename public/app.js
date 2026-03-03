const generateBtn = document.getElementById('generateBtn');
const statusEl = document.getElementById('status');
const cardEl = document.getElementById('resultCard');
const nameEl = document.getElementById('name');
const addressEl = document.getElementById('address');
const categoryEl = document.getElementById('category');
const mapsLinkEl = document.getElementById('mapsLink');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b91c1c' : '#6b7280';
}

function getCategoryLabel(categories = []) {
  const visibleCategory = categories.find((c) => c !== 'catering.restaurant') || categories[0];
  return visibleCategory ? visibleCategory.replaceAll('.', ' > ') : 'restaurant';
}

function formatAddress(properties) {
  const parts = [
    properties.address_line1,
    properties.address_line2,
    properties.city,
    properties.postcode
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address unavailable';
}

async function fetchRestaurants() {
  const response = await fetch('/api/restaurants');

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.details) {
        message = `${message}: ${errorData.details}`;
      } else if (errorData?.error) {
        message = `${message}: ${errorData.error}`;
      }
    } catch {
      // Keep the fallback message when response body is not JSON.
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data.features?.length) {
    throw new Error('No restaurants found in response');
  }

  return data.features;
}

async function handleGenerateClick() {
  try {
    generateBtn.disabled = true;
    setStatus('Fetching restaurant...');

    const restaurants = await fetchRestaurants();
    const restaurant = restaurants[0];
    const properties = restaurant.properties || {};

    nameEl.textContent = properties.name || 'Unnamed restaurant';
    addressEl.textContent = formatAddress(properties);
    categoryEl.textContent = getCategoryLabel(properties.categories || []);

    const [lng, lat] = restaurant.geometry?.coordinates || [];
    if (typeof lat === 'number' && typeof lng === 'number') {
      mapsLinkEl.href = `https://www.google.com/maps?q=${lat},${lng}`;
      mapsLinkEl.classList.remove('hidden');
    } else {
      mapsLinkEl.classList.add('hidden');
    }

    cardEl.classList.remove('hidden');
    setStatus('New restaurant generated. Click again for another one.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Something went wrong while fetching data.', true);
    cardEl.classList.add('hidden');
  } finally {
    generateBtn.disabled = false;
  }
}

generateBtn.addEventListener('click', handleGenerateClick);
