import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import learningBanner from "@/assets/learning-banner.svg";
import Banner from "@/assets/subscription.png";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  createSubscriptionCheckout,
  activateFreePlan,
  getSubscriptionPlans,
  type SubscriptionPlan,
  verifySubscriptionPayment,
} from "@/services/subscriptionApi";

const StudentSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadPlans() {
      try {
        const data = await getSubscriptionPlans();
        if (!mounted) return;
        setPlans(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load plans");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadPlans();
    return () => {
      mounted = false;
    };
  }, []);

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector("script[data-razorpay]")) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpay = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      setProcessingPlan(plan.id);
      if (plan.amount_paise === 0) {
        await activateFreePlan(plan.id);
        navigate("/select");
        return;
      }
      await loadRazorpayScript();
      const checkout = await createSubscriptionCheckout(plan.id);

      const razorpay = new (window as any).Razorpay({
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency,
        name: "Super-LMS",
        description: plan.name,
        order_id: checkout.order_id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          await verifySubscriptionPayment({
            plan_id: plan.id,
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          navigate("/select");
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      });

      razorpay.open();
    } catch (err) {
      console.error("Subscription payment failed", err);
      alert("Payment failed or cancelled. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface-elevated">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-3 pb-5">
        <section
          className="grid gap-6 rounded-3xl border border-border bg-gradient-to-br from-white via-sky-50 to-indigo-50 px-4 py-5 shadow-sm md:px-6 lg:grid-cols-[3fr_1fr]">
          {/* RIGHT IMAGE (Mobile: top | Desktop: right) */}
          <div className="flex justify-center lg:order-2 lg:justify-end">
            <div
              className="rounded-2xl border border-border bg-white p-3 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 shadow-md">
              <img
                src={Banner}
                alt="Students learning with an AI tutor"
                className="h-[110px] md:h-[120px] w-auto object-contain rounded-sm"
                loading="lazy"
              />
            </div>
          </div>

          {/* LEFT CONTENT */}
          <div className="space-y-3 text-center lg:order-1 lg:text-left">
            <h2 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              A personal teacher that adapts to your board and class
            </h2>
            <p className="text-sm text-slate-600">
              Get clear explanations and real-time doubt solving without leaving
              your study flow.
            </p>
            {/* Desktop-only board cards */}
            <div className="hidden lg:grid grid-cols-2 gap-2 max-w-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition text-center">
                <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Choose Your Plan ↓</div>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm hover:shadow-md transition text-center">
                <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">With Your Goal ↑</div>
              </div>
            </div>

          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-3">
          {isLoading && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground lg:col-span-3">
              Loading subscription plans...
            </div>
          )}
          {!isLoading && error && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground lg:col-span-3">
              {error}
            </div>
          )}
          {!isLoading && !error && plans.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground lg:col-span-3">
              No plans available yet.
            </div>
          )}
          {!isLoading &&
            !error &&
            plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm "
              >
                <div className="text-lg font-semibold">{plan.name}</div>
                <div className="mt-2 text-2xl font-semibold text-primary">
                  {plan.price}
                </div>
                {plan.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingPlan === plan.id}
                  className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processingPlan === plan.id
                    ? "Processing..."
                    : `Subscribe to ${plan.name}`}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StudentSubscription;
