import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { userService } from '../services/user.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Initialize Stripe (will be null if not configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// POST /stripe/create-checkout - Create Stripe checkout session
router.post(
  '/create-checkout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe || !STRIPE_PRICE_ID) {
      res.status(503).json({ 
        success: false, 
        error: 'Stripe is not configured' 
      });
      return;
    }

    try {
      const user = await userService.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await userService.updateSubscription(user.id, 'trial', null, customerId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${FRONTEND_URL}?subscription=success`,
        cancel_url: `${FRONTEND_URL}?subscription=cancelled`,
        metadata: { userId: user.id },
      });

      res.json({
        success: true,
        data: { url: session.url },
      });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ success: false, error: 'Failed to create checkout session' });
    }
  }
);

// POST /stripe/create-portal - Create Stripe customer portal session
router.post(
  '/create-portal',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe) {
      res.status(503).json({ 
        success: false, 
        error: 'Stripe is not configured' 
      });
      return;
    }

    try {
      const user = await userService.findById(req.user!.userId);
      if (!user || !user.stripeCustomerId) {
        res.status(400).json({ 
          success: false, 
          error: 'No subscription found' 
        });
        return;
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: FRONTEND_URL,
      });

      res.json({
        success: true,
        data: { url: session.url },
      });
    } catch (error) {
      console.error('Create portal error:', error);
      res.status(500).json({ success: false, error: 'Failed to create portal session' });
    }
  }
);

// POST /stripe/webhook - Handle Stripe webhooks
router.post(
  '/webhook',
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe) {
      res.status(503).json({ success: false, error: 'Stripe is not configured' });
      return;
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      res.status(503).json({ success: false, error: 'Webhook secret not configured' });
      return;
    }

    let event: Stripe.Event;

    try {
      // req.body should be raw buffer for webhook verification
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({ success: false, error: 'Webhook signature verification failed' });
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (userId) {
            await userService.updateSubscription(
              userId,
              'active',
              null, // Will be set by subscription event
              session.customer as string
            );
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await userService.findByStripeCustomerId(customerId);
          
          if (user) {
            const status = subscription.status === 'active' ? 'active' : 
                          subscription.status === 'trialing' ? 'trial' : 'inactive';
            const endDate = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null;
            
            await userService.updateSubscription(user.id, status, endDate);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await userService.findByStripeCustomerId(customerId);
          
          if (user) {
            await userService.updateSubscription(user.id, 'cancelled', null);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const user = await userService.findByStripeCustomerId(customerId);
          
          if (user) {
            await userService.updateSubscription(user.id, 'inactive', null);
          }
          break;
        }
      }

      res.json({ success: true, received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ success: false, error: 'Webhook handler failed' });
    }
  }
);

export default router;
