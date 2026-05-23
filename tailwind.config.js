/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Heebo', 'system-ui', 'sans-serif'],
  			display: ['Heebo', 'system-ui', 'sans-serif']
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			stadium: {
  				DEFAULT: 'hsl(var(--st-bg) / <alpha-value>)',
  				2: 'hsl(var(--st-bg-2) / <alpha-value>)',
  				surface: 'hsl(var(--st-surface) / <alpha-value>)',
  				raised: 'hsl(var(--st-surface-2) / <alpha-value>)',
  				border: 'hsl(var(--st-border) / <alpha-value>)'
  			},
  			gold: {
  				DEFAULT: 'hsl(var(--st-gold) / <alpha-value>)',
  				hi: 'hsl(var(--st-gold-hi) / <alpha-value>)',
  				lo: 'hsl(var(--st-gold-lo) / <alpha-value>)'
  			},
  			pitch: {
  				DEFAULT: 'hsl(var(--st-pitch) / <alpha-value>)',
  				hi: 'hsl(var(--st-pitch-hi) / <alpha-value>)',
  				lo: 'hsl(var(--st-pitch-lo) / <alpha-value>)'
  			},
  			ink: {
  				DEFAULT: 'hsl(var(--st-text) / <alpha-value>)',
  				2: 'hsl(var(--st-text-2) / <alpha-value>)',
  				3: 'hsl(var(--st-text-3) / <alpha-value>)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'st-rise': {
  				from: { opacity: '0', transform: 'translateY(22px)' },
  				to: { opacity: '1', transform: 'none' }
  			},
  			'st-fade': {
  				from: { opacity: '0' },
  				to: { opacity: '1' }
  			},
  			'st-float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-8px)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'st-rise': 'st-rise 0.62s cubic-bezier(0.22,1,0.36,1) both',
  			'st-fade': 'st-fade 0.7s ease both',
  			'st-float': 'st-float 5s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}