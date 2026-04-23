(function () {
  const form = document.getElementById('reservation-form');
  const list = document.getElementById('reservations');
  const emptyState = document.getElementById('empty-state');

  const storageKey = 'reservations';
  const reservations = loadReservations();
  renderReservations();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const person = form.person.value.trim();
    const phone = sanitizePhone(form.phone.value);
    const reservationDate = form.reservationDate.value;

    if (!person || !phone || !reservationDate) {
      return;
    }

    const reservationIso = new Date(reservationDate).toISOString();

    reservations.push({
      id: crypto.randomUUID(),
      person,
      phone,
      reservationIso
    });

    saveReservations();
    renderReservations();
    form.reset();
  });

  function sanitizePhone(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function createReminderMessage(reservation, daysBefore) {
    const whenLabel = daysBefore === 1 ? 'tomorrow' : 'today';

    return `Hi ${reservation.person}! This is a reminder that your reservation is ${whenLabel} (${formatDate(reservation.reservationIso)}).`;
  }

  function buildWhatsAppLink(phone, message) {
    const normalizedPhone = phone.replace(/^\+/, '');
    return `https://wa.me/${encodeURIComponent(normalizedPhone)}?text=${encodeURIComponent(message)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderReservations() {
    list.innerHTML = '';
    emptyState.hidden = reservations.length > 0;

    reservations
      .slice()
      .sort((a, b) => new Date(a.reservationIso) - new Date(b.reservationIso)
      )
      .forEach((reservation) => {
        const li = document.createElement('li');
        li.className = 'reservation';

        const dayBeforeReminderText = createReminderMessage(reservation, 1);
        const sameDayReminderText = createReminderMessage(reservation, 0);

        li.innerHTML = `
          <strong>${escapeHtml(reservation.person)}</strong>
          <p class="meta">Phone: ${escapeHtml(reservation.phone)}</p>
          <p class="meta">Reservation: ${formatDate(reservation.reservationIso)}</p>
          <div class="reminders">
            <a class="whatsapp-link" target="_blank" rel="noopener noreferrer"
              href="${buildWhatsAppLink(reservation.phone, dayBeforeReminderText)}">
              WhatsApp reminder (1 day before)
            </a>
            <a class="whatsapp-link" target="_blank" rel="noopener noreferrer"
              href="${buildWhatsAppLink(reservation.phone, sameDayReminderText)}">
              WhatsApp reminder (same day)
            </a>
          </div>
        `;

        list.appendChild(li);
      });
  }

  function loadReservations() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      return [];
    }
  }

  function saveReservations() {
    localStorage.setItem(storageKey, JSON.stringify(reservations));
  }
})();
