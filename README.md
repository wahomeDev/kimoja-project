# KIMOJA – ELITE Group

**Description:**  
Web app to manage truck attendance and worker payment distribution with full transparency.

## Features

- Add trucks with amounts
- Track worker attendance per truck
- Live calculation of totals per worker
- Reset pay cycle after payment
- Payment History:
  - Shows all past pay cycles
  - Displays cumulative totals per worker
  - Newest cycles appear first
  - Toggle visibility (Show/Hide button)
- Highlight workers with zero attendance (light red background)
- Optional: Daily earnings graph (planned next)

## Usage

1. Add truck plate and amount, then click "Add Truck".
2. Mark attendance by checking the boxes for workers present.
3. Totals update automatically.
4. Close pay cycle to save snapshot to Payment History.
5. Toggle Payment History visibility using the button.
6. Reset cycle after payment if necessary.

## Technical Details

- Uses **LocalStorage** to persist truck data and payment history.
- `renderTable()` handles attendance display and zero-attendance highlights.
- `calculateTotals()` computes totals automatically.
- `renderPaymentHistory()` displays cumulative totals and past cycles.
- `toggleHistory()` allows hiding/showing the Payment History section.
