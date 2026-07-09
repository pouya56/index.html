import {
  reactExtension,
  useApi,
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Banner,
  Button,
  Spinner,
  Divider,
} from "@shopify/ui-extensions-react/customer-account";
import { useEffect, useState } from "react";
import { FIREBASE_URL } from "./config.js";

export default reactExtension("customer-account.page.render", () => <AccountPage />);

// Firebase keys can't contain . # $ [ ] / — sanitize an email into a key.
function emailKey(email) {
  return String(email || "").toLowerCase().replace(/[.#$/[\]]/g, "_");
}

function AccountPage() {
  const api = useApi();
  const [email, setEmail] = useState("");
  const [reviews, setReviews] = useState(null); // null = loading, [] = none
  const [error, setError] = useState("");

  // 1) Get the signed-in customer's email via the Customer Account API.
  //    Verify the exact query/hook against your @shopify/ui-extensions-react version.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.query(
          `query { customer { emailAddress { emailAddress } firstName } }`
        );
        const e = res?.data?.customer?.emailAddress?.emailAddress || "";
        setEmail(e);
      } catch (e) {
        // Fall back gracefully if the query shape differs on your version.
        setEmail("");
      }
    })();
  }, [api]);

  // 2) Load this customer's reviews from Firebase.
  //    NOTE: the theme currently stores "my reviews" in the browser (localStorage),
  //    which this extension CANNOT read. To make this work, have the theme ALSO
  //    write each posted review to a per-customer index, e.g.:
  //        PUT /customer_reviews/<emailKey>/<reviewId>.json
  //    Then this fetch returns the customer's reviews here. Until that exists,
  //    this list will simply be empty (handled below).
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${FIREBASE_URL}/customer_reviews/${encodeURIComponent(emailKey(email))}.json`;
        const r = await fetch(url);
        const data = (await r.json()) || {};
        const list = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        list.sort((a, b) => (b.t || 0) - (a.t || 0));
        if (!cancelled) setReviews(list);
      } catch (e) {
        if (!cancelled) {
          setReviews([]);
          setError("Couldn’t load reviews right now.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  return (
    <Page title="Rewards & Reviews">
      <BlockStack spacing="loose">
        {error ? <Banner status="warning">{error}</Banner> : null}

        {/* ---- Your reviews (from Firebase) ---- */}
        <Card padding>
          <BlockStack spacing="base">
            <Text size="medium" emphasis="bold">
              Your reviews
            </Text>
            {reviews === null ? (
              <Spinner accessibilityLabel="Loading your reviews" />
            ) : reviews.length === 0 ? (
              <Text appearance="subdued">You haven’t written any reviews yet.</Text>
            ) : (
              reviews.map((rv, i) => (
                <BlockStack key={rv.id} spacing="tight">
                  {i > 0 ? <Divider /> : null}
                  <InlineStack spacing="base">
                    <Text emphasis="bold">{rv.title || "Product"}</Text>
                    <Text appearance="subdued">{"★".repeat(Math.max(0, Math.min(5, rv.rating || 0)))}</Text>
                  </InlineStack>
                  {rv.text ? <Text appearance="subdued">{rv.text}</Text> : null}
                </BlockStack>
              ))
            )}
          </BlockStack>
        </Card>

        {/* ---- Wishlist (TODO) ---- */}
        <Card padding>
          <BlockStack spacing="base">
            <Text size="medium" emphasis="bold">
              Wishlist
            </Text>
            <Text appearance="subdued">
              To show the wishlist here, store it per customer in Firebase (the theme keeps
              it in the browser, which this page can’t read). See README → “Backend note”.
            </Text>
            <Button to="shopify://store" appearance="monochrome">
              Browse products
            </Button>
          </BlockStack>
        </Card>

        {/* ---- Saved designs (TODO) ---- */}
        <Card padding>
          <BlockStack spacing="base">
            <Text size="medium" emphasis="bold">
              Saved designs
            </Text>
            <Text appearance="subdued">
              Same as the wishlist — move saved designs to Firebase (keyed by customer email)
              and read them here.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
