"use client"

import { MapPin, Phone, Clock, Mail, Globe, Instagram, Facebook, Twitter } from 'lucide-react'

interface RestaurantFooterProps {
  restaurant: {
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
    instagramHandle?: string | null
    facebookHandle?: string | null
    twitterHandle?: string | null
    openingHours?: string | null
  }
  primaryColor: string
  secondaryColor: string
  fontFamily?: string
}

export default function RestaurantFooter({
  restaurant,
  primaryColor,
  secondaryColor,
  fontFamily
}: RestaurantFooterProps) {
  const currentYear = new Date().getFullYear()

  const hasContactInfo = restaurant.address || restaurant.phone || restaurant.email || restaurant.website
  const hasSocialMedia = restaurant.instagramHandle || restaurant.facebookHandle || restaurant.twitterHandle

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16 sm:mt-20 md:mt-24 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {/* Restaurant Info */}
          <div className="space-y-4">
            <h3
              className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {restaurant.name}
            </h3>
            <div
              className="w-16 h-1 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Experience the finest dining with our carefully curated menu. Every dish is prepared with passion and the freshest ingredients.
            </p>
          </div>

          {/* Contact Information */}
          {hasContactInfo && (
            <div className="space-y-4">
              <h4
                className="text-lg font-semibold text-gray-900 dark:text-white"
                style={{ fontFamily: fontFamily || 'inherit' }}
              >
                Contact Us
              </h4>
              <div className="space-y-3">
                {restaurant.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  >
                    <MapPin
                      className="h-5 w-5 flex-shrink-0 mt-0.5 transition-colors"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-sm">{restaurant.address}</span>
                  </a>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  >
                    <Phone
                      className="h-5 w-5 flex-shrink-0 transition-colors"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-sm">{restaurant.phone}</span>
                  </a>
                )}
                {restaurant.email && (
                  <a
                    href={`mailto:${restaurant.email}`}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  >
                    <Mail
                      className="h-5 w-5 flex-shrink-0 transition-colors"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-sm">{restaurant.email}</span>
                  </a>
                )}
                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
                  >
                    <Globe
                      className="h-5 w-5 flex-shrink-0 transition-colors"
                      style={{ color: primaryColor }}
                    />
                    <span className="text-sm break-all">{restaurant.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Hours & Social */}
          <div className="space-y-6">
            {/* Opening Hours */}
            {restaurant.openingHours && (
              <div className="space-y-4">
                <h4
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                  style={{ fontFamily: fontFamily || 'inherit' }}
                >
                  Opening Hours
                </h4>
                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                  <Clock
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    style={{ color: primaryColor }}
                  />
                  <div className="text-sm whitespace-pre-line">{restaurant.openingHours}</div>
                </div>
              </div>
            )}

            {/* Social Media */}
            {hasSocialMedia && (
              <div className="space-y-4">
                <h4
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                  style={{ fontFamily: fontFamily || 'inherit' }}
                >
                  Follow Us
                </h4>
                <div className="flex items-center gap-3">
                  {restaurant.instagramHandle && (
                    <a
                      href={`https://instagram.com/${restaurant.instagramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                      }}
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" style={{ color: primaryColor }} />
                    </a>
                  )}
                  {restaurant.facebookHandle && (
                    <a
                      href={`https://facebook.com/${restaurant.facebookHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                      }}
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" style={{ color: primaryColor }} />
                    </a>
                  )}
                  {restaurant.twitterHandle && (
                    <a
                      href={`https://twitter.com/${restaurant.twitterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                      }}
                      aria-label="Twitter"
                    >
                      <Twitter className="h-5 w-5" style={{ color: primaryColor }} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p style={{ fontFamily: fontFamily || 'inherit' }}>
              © {currentYear} {restaurant.name}. All rights reserved.
            </p>
            <p className="flex items-center gap-2" style={{ fontFamily: fontFamily || 'inherit' }}>
              Powered by{' '}
              <span className="font-semibold" style={{ color: primaryColor }}>
                Foodify
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
