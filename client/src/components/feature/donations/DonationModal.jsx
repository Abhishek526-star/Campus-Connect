import { useEffect, useState } from 'react';
import { HandHeart } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateDonationOrderMutation, useVerifyDonationMutation } from '../../../services/donationsApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Checkbox } from '../../ui/Checkbox.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Textarea } from '../../ui/Textarea.jsx';

const PRESETS = [500, 1000, 2500, 5000];

/**
 * Donation modal (spec §12): amount presets, message, anonymity, then a REAL
 * Razorpay checkout (test mode). Card data never touches our server — the
 * payment happens on Razorpay's hosted checkout, and we verify the result
 * server-side with HMAC.
 */
export function DonationModal({ scholarship, open, onClose }) {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOrder] = useCreateDonationOrderMutation();
  const [verifyDonation] = useVerifyDonationMutation();

  const finalAmount = customAmount ? Number(customAmount) : amount;

  // Load the Razorpay checkout script once.
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleDonate = async () => {
    if (!finalAmount || finalAmount < 1) {
      toast.error('Enter a valid donation amount.');
      return;
    }
    setCreating(true);
    try {
      // 1. Create the order server-side (real Razorpay order).
      const { data } = await createOrder({
        scholarshipId: scholarship?._id ?? null,
        amount: finalAmount,
        message: message || undefined,
        anonymous,
      }).unwrap();
      // Server payload: { orderId, keyId, amount, currency, ... } — `data` IS
      // that payload (the response body's `data` key), so no extra `.data`.
      const { orderId, keyId, amount: orderAmount, currency } = data;

      // 2. Open the Razorpay checkout (test mode). Payment happens on Razorpay's side.
      const paymentObject = new window.Razorpay({
        key: keyId,
        amount: orderAmount * 100,
        currency,
        name: 'Campus Connect',
        description: scholarship ? `Donation to ${scholarship.name}` : 'General community donation',
        order_id: orderId,
        handler: async (response) => {
          // 3. Verify server-side (HMAC signature check).
          try {
            await verifyDonation({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }).unwrap();
            toast.success('Donation successful — thank you for giving back! 🎉');
            onClose();
            setMessage('');
            setCustomAmount('');
          } catch (error) {
            toast.error(getErrorMessage(error, 'Payment verification failed.'));
          }
        },
        modal: { ondismiss: () => setCreating(false) },
        theme: { color: '#2563eb' },
      });

      paymentObject.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description ?? 'Please try again.'}`);
        setCreating(false);
      });

      paymentObject.open();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start the payment.'));
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={scholarship ? `Donate to ${scholarship.name}` : 'Make a donation'}
      description="Secure payment via Razorpay — your card details never touch Campus Connect."
      size="md"
    >
      <div className="space-y-5">
        {/* Amount */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Amount <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={
                  finalAmount === preset && !customAmount
                    ? 'rounded-xl border-2 border-primary-500 bg-primary-50 py-2.5 text-sm font-bold text-primary-700'
                    : 'rounded-xl border-2 border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300'
                }
              >
                ₹{preset.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            placeholder="Custom amount (₹)"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            className="mt-2"
            aria-label="Custom donation amount"
          />
        </div>

        {/* Message */}
        <Textarea
          label="Message (optional)"
          rows={2}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="A note for the students you're supporting…"
        />

        {/* Anonymous */}
        <Checkbox
          label="Donate anonymously"
          description="Your name won't appear in the donor list."
          checked={anonymous}
          onChange={(event) => setAnonymous(event.target.checked)}
        />

        <div className="rounded-xl border border-accent-200 bg-accent-50 p-3.5 text-xs leading-relaxed text-accent-800">
          <p className="font-semibold">💳 Razorpay test mode</p>
          <p className="mt-1">
            This runs the real payment flow in test mode. Use test card <span className="font-mono font-semibold">4111 1111 1111 1111</span>,
            any future expiry, and any CVV. No real money moves.
          </p>
        </div>

        <Button size="lg" className="w-full" onClick={handleDonate} loading={creating}>
          {!creating && <HandHeart className="size-4" aria-hidden="true" />}
          Donate {finalAmount ? `₹${Number(finalAmount).toLocaleString('en-IN')}` : ''}
        </Button>
      </div>
    </Modal>
  );
}
