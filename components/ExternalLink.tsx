/**
 * A link component that handles external URLs appropriately for each platform
 * On web, opens in a new tab
 * On native platforms, opens in an in-app browser
 */
import { Href, Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

/**
 * Props for the ExternalLink component
 * Extends Link props with a required href string
 */
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * ExternalLink component that handles external URL navigation
 * Provides platform-specific behavior for opening links
 */
export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Prevent default browser behavior on native platforms
          event.preventDefault();
          // Open link in an in-app browser for better user experience
          await openBrowserAsync(href);
        }
      }}
    />
  );
}
