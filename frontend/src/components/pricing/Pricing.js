import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import './Pricing.css';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState('annually');
  const [showComparison, setShowComparison] = useState(false);

  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === 'annually' ? 'monthly' : 'annually');
  };

  // Define pricing tiers
  const pricingTiers = [
    {
      name: 'Free',
      price: {
        monthly: 0,
        annually: 0
      },
      description: 'For small, simple events',
      eventLimit: '1 active event',
      guestLimit: 'Up to 50 guests',
      features: [
        { name: 'Basic RSVP Collection', included: true },
        { name: 'Single Event Management', included: true },
        { name: 'Basic Guest List', included: true },
        { name: 'Email Invitations', included: true },
        { name: 'Limited Customization', included: true },
        { name: 'Basic Reports', included: true },
        { name: 'Community Support', included: true },
        { name: 'Team Management', included: false },
        { name: 'Custom Branding', included: false },
        { name: 'Advanced Analytics', included: false },
        { name: 'Premium Support', included: false }
      ],
      highlight: false,
      color: 'light',
      buttonVariant: 'outline-primary'
    },
    {
      name: 'Essential',
      price: {
        monthly: 19.99,
        annually: 16.99
      },
      description: 'Perfect for medium-sized events',
      eventLimit: '5 active events',
      guestLimit: 'Up to 250 guests per event',
      features: [
        { name: 'Advanced RSVP Collection', included: true },
        { name: 'Multiple Event Management', included: true },
        { name: 'Comprehensive Guest List', included: true },
        { name: 'Email & SMS Invitations', included: true },
        { name: 'Custom RSVP Forms', included: true },
        { name: 'Detailed Reports & Exports', included: true },
        { name: 'Priority Email Support', included: true },
        { name: 'Basic Team Management', included: true },
        { name: 'Limited Branding Options', included: true },
        { name: 'Basic Analytics', included: true },
        { name: 'Guest Messaging', included: false }
      ],
      highlight: false,
      color: 'info',
      buttonVariant: 'outline-info'
    },
    {
      name: 'Professional',
      price: {
        monthly: 49.99,
        annually: 39.99
      },
      description: 'For businesses and large events',
      eventLimit: 'Unlimited active events',
      guestLimit: 'Up to 1000 guests per event',
      features: [
        { name: 'Full-featured RSVP Platform', included: true },
        { name: 'Unlimited Event Management', included: true },
        { name: 'VIP Guest Categorization', included: true },
        { name: 'All Communication Channels', included: true },
        { name: 'Fully Customizable RSVP Forms', included: true },
        { name: 'Advanced Reports & Analytics', included: true },
        { name: 'Dedicated Support', included: true },
        { name: 'Full Team Management', included: true },
        { name: 'Complete White Labeling', included: true },
        { name: 'Comprehensive Analytics', included: true },
        { name: 'Guest Messaging', included: true }
      ],
      highlight: true,
      color: 'primary',
      buttonVariant: 'primary'
    },
    {
      name: 'Enterprise',
      price: {
        monthly: 99.99,
        annually: 79.99
      },
      description: 'For large organizations',
      eventLimit: 'Unlimited events',
      guestLimit: 'Unlimited guests',
      features: [
        { name: 'Everything in Professional', included: true },
        { name: 'Multi-team Management', included: true },
        { name: 'Advanced Security Features', included: true },
        { name: 'API Access', included: true },
        { name: 'Custom Integration Development', included: true },
        { name: 'Dedicated Account Manager', included: true },
        { name: '24/7 Premium Support', included: true },
        { name: 'Custom Feature Development', included: true },
        { name: 'On-site Training', included: true },
        { name: 'SLA Guarantees', included: true },
        { name: 'Advanced Data Export', included: true }
      ],
      highlight: false,
      color: 'dark',
      buttonVariant: 'outline-dark'
    }
  ];

  // Function to render checkmarks or X marks
  const renderFeatureStatus = (included) => {
    return included ? 
      <FaCheck className="text-success" /> : 
      <FaTimes className="text-danger" />;
  };

  return (
    <Container className="pricing-container py-5">
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4">Choose Your Perfect Plan</h1>
          <p className="lead">
            Powerful event management and RSVP solutions for events of any size
          </p>

          {/* Billing period toggle */}
          <div className="billing-toggle mt-4 mb-5">
            <span className={`billing-option ${billingPeriod === 'monthly' ? 'active' : ''}`}>
              Monthly
            </span>
            <div className="form-check form-switch d-inline-block mx-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="billingToggle"
                onChange={toggleBillingPeriod}
                checked={billingPeriod === 'annually'}
                style={{ width: '3rem', height: '1.5rem' }}
              />
              <label className="form-check-label" htmlFor="billingToggle">
                {billingPeriod === 'annually' && <Badge bg="success" className="ms-2">Save 20%</Badge>}
              </label>
            </div>
            <span className={`billing-option ${billingPeriod === 'annually' ? 'active' : ''}`}>
              Annually
            </span>
          </div>
        </Col>
      </Row>

      <Row className="pricing-cards">
        {pricingTiers.map((tier, index) => (
          <Col key={index} lg={3} md={6} className="mb-4">
            <Card 
              className={`pricing-card h-100 ${tier.highlight ? 'highlight' : ''}`}
              border={tier.highlight ? 'primary' : undefined}
            >
              <Card.Header className={`bg-${tier.color} ${tier.color === 'light' || tier.color === 'warning' ? 'text-dark' : 'text-white'}`}>
                <h3 className="my-0 fw-normal">{tier.name}</h3>
                {tier.highlight && <Badge bg="warning" className="position-absolute top-0 end-0 translate-middle-y me-3">POPULAR</Badge>}
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="pricing-card-title">
                  <span className="currency">$</span>
                  <span className="amount">{tier.price[billingPeriod]}</span>
                  <small className="text-muted fw-light">/mo</small>
                </Card.Title>
                <Card.Text>{tier.description}</Card.Text>
                <div className="limits mb-3">
                  <p><strong>Event Limit:</strong> {tier.eventLimit}</p>
                  <p><strong>Guest Limit:</strong> {tier.guestLimit}</p>
                </div>
                <ul className="list-unstyled mt-3 mb-4">
                  {tier.features.slice(0, 6).map((feature, featureIndex) => (
                    <li key={featureIndex} className={!feature.included ? 'text-muted' : ''}>
                      {renderFeatureStatus(feature.included)} {feature.name}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={tier.buttonVariant} 
                  size="lg" 
                  className="mt-auto w-100"
                >
                  {tier.name === 'Free' ? 'Get Started' : 'Subscribe Now'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Row className="mt-5">
        <Col className="text-center">
          <Button 
            variant="link" 
            onClick={() => setShowComparison(!showComparison)} 
            className="toggle-comparison"
          >
            {showComparison ? 'Hide Detailed Comparison' : 'Show Detailed Comparison'}
          </Button>
        </Col>
      </Row>
      
      {showComparison && (
        <Row className="mt-4">
          <Col>
            <div className="table-responsive comparison-table">
              <Table striped bordered hover>
                <thead>
                  <tr className="bg-light">
                    <th>Feature</th>
                    {pricingTiers.map((tier, index) => (
                      <th key={index} className="text-center">
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Combine all unique features from all tiers */}
                  {pricingTiers[0].features.map((_, featureIndex) => (
                    <tr key={featureIndex}>
                      <td>{pricingTiers[3].features[featureIndex].name}</td>
                      {pricingTiers.map((tier, tierIndex) => (
                        <td key={tierIndex} className="text-center">
                          {renderFeatureStatus(tier.features[featureIndex].included)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}
      
      <Row className="mt-5">
        <Col lg={8} className="mx-auto">
          <div className="faq-section">
            <h2 className="text-center mb-4">Frequently Asked Questions</h2>
            
            <div className="faq-item mb-4">
              <h5><FaQuestionCircle className="me-2" /> Can I upgrade or downgrade my plan?</h5>
              <p>Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate will apply at the next billing cycle.</p>
            </div>
            
            <div className="faq-item mb-4">
              <h5><FaQuestionCircle className="me-2" /> Is there a contract or commitment?</h5>
              <p>No long-term contract is required. You can cancel your subscription anytime from your account dashboard.</p>
            </div>
            
            <div className="faq-item mb-4">
              <h5><FaQuestionCircle className="me-2" /> Do you offer discounts for nonprofits?</h5>
              <p>Yes, we offer special pricing for nonprofit organizations. Please contact our sales team for more information.</p>
            </div>
            
            <div className="faq-item">
              <h5><FaQuestionCircle className="me-2" /> Can I get a demo before subscribing?</h5>
              <p>Absolutely! We offer free demos for the Professional and Enterprise plans. Contact us to schedule your personalized demonstration.</p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Pricing;
