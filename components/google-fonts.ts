// Popular Google Fonts for restaurants/businesses
export const POPULAR_FONTS = [
  { name: 'Inter', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { name: 'Roboto', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap' },
  { name: 'Open Sans', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { name: 'Poppins', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { name: 'Lato', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { name: 'Montserrat', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { name: 'Nunito', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { name: 'Source Sans Pro', category: 'sans-serif', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' },
  { name: 'Playfair Display', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { name: 'Merriweather', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
  { name: 'Crimson Text', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap' },
  { name: 'Lora', category: 'serif', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap' },
  { name: 'Dancing Script', category: 'handwriting', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap' },
  { name: 'Pacifico', category: 'handwriting', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { name: 'Lobster', category: 'display', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
  { name: 'Oswald', category: 'display', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap' }
]

/** The badge classes of a font category; display fonts are the one category set apart. */
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'sans-serif': return 'bg-muted text-muted-foreground border-border'
    case 'serif': return 'bg-muted text-muted-foreground border-border'
    case 'handwriting': return 'bg-muted text-muted-foreground border-border'
    case 'display': return 'bg-muted text-warning border-border'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}
