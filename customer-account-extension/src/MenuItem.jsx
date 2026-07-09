import { reactExtension, Link } from "@shopify/ui-extensions-react/customer-account";

// Renders the link that appears in the customer-account navigation menu.
// It points at THIS extension's page (the customer-account.page.render target).
export default reactExtension(
  "customer-account.page.menu-item.render",
  () => <MenuLink />
);

function MenuLink() {
  // `to="extension:/"` routes to this extension's page target. Verify the exact
  // routing string in `shopify app dev` for your CLI/api version.
  return <Link to="extension:/">Rewards &amp; Reviews</Link>;
}
