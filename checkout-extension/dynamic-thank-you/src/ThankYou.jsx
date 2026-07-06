import {
  reactExtension,
  BlockStack,
  InlineStack,
  View,
  Heading,
  Text,
  Button,
  useSettings,
  useApi,
} from '@shopify/ui-extensions-react/checkout';

// Target: a movable block on the Thank-you page. Merchants add it in
// Settings > Checkout > Customize > (Thank you page) > Add block.
export default reactExtension('purchase.thank-you.block.render', () => <DynamicThankYou />);

function DynamicThankYou() {
  const settings = useSettings();
  const { orderConfirmation } = useApi();

  const heading = settings.heading || 'Thank you for your order';
  const message =
    settings.message ||
    'Every piece is made to order, just for you. We’ll start crafting your order now and email you the moment it ships.';
  const buttonLabel = settings.button_label || 'Continue shopping';
  const buttonUrl = settings.button_url || '';

  // Order number, if available on this surface.
  let orderNumber = '';
  try {
    orderNumber = (orderConfirmation && orderConfirmation.current && orderConfirmation.current.number) || '';
  } catch (e) {
    orderNumber = '';
  }

  const steps = [
    { t: 'We craft your order', d: 'Your personalized items are made to order over the next few days.' },
    { t: 'Shipping confirmation', d: 'You’ll get an email with tracking as soon as your order leaves us.' },
    { t: 'It arrives', d: 'Unwrap something made just the way you designed it.' },
  ];

  return (
    <View border="base" cornerRadius="large" padding="base">
      <BlockStack spacing="base">
        <Heading level={2}>{heading}</Heading>

        {orderNumber ? (
          <Text appearance="subdued" size="small">
            Order #{orderNumber} is confirmed. A receipt is on its way to your inbox.
          </Text>
        ) : null}

        <Text appearance="subdued">{message}</Text>

        <BlockStack spacing="tight">
          {steps.map((s, i) => (
            <InlineStack key={i} spacing="base" blockAlignment="leading">
              <View minInlineSize={24}>
                <Text emphasis="bold">{i + 1}</Text>
              </View>
              <BlockStack spacing="none">
                <Text emphasis="bold">{s.t}</Text>
                <Text appearance="subdued" size="small">
                  {s.d}
                </Text>
              </BlockStack>
            </InlineStack>
          ))}
        </BlockStack>

        {buttonUrl ? (
          <Button kind="primary" to={buttonUrl}>
            {buttonLabel}
          </Button>
        ) : null}
      </BlockStack>
    </View>
  );
}
