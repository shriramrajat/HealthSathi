"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/components/providers/language-provider'
import { 
  getEnabledLanguages, 
  getLanguageByCode, 
  type Language 
} from '@/lib/i18n/languages'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'compact'
  showLabel?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function LanguageSwitcher({ 
  className,
  variant = 'dropdown',
  showLabel = true,
  size = 'default'
}: LanguageSwitcherProps) {
  const t = useTranslations('common.language')
  const { currentLanguage, setLanguage, isLoading } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  
  const enabledLanguages = getEnabledLanguages()
  const currentLang = getLanguageByCode(currentLanguage)

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) return
    
    try {
      await setLanguage(languageCode)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, languageCode: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleLanguageChange(languageCode)
    }
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'icon'}
            className={cn(
              "relative",
              size === 'sm' && "h-8 w-8",
              size === 'default' && "h-9 w-9", 
              size === 'lg' && "h-10 w-10",
              className
            )}
            disabled={isLoading}
            aria-label={t('switchLanguage')}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <span className="text-lg" role="img" aria-hidden="true">
              {currentLang?.flag || '🌐'}
            </span>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="min-w-[160px]"
          role="menu"
          aria-label={t('languageOptions')}
        >
          {enabledLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              onKeyDown={(e) => handleKeyDown(e, language.code)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                currentLanguage === language.code && "bg-accent"
              )}
              role="menuitem"
              aria-current={currentLanguage === language.code ? 'true' : 'false'}
            >
              <span className="text-lg" role="img" aria-label={`${language.name} flag`}>
                {language.flag}
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">{language.name}</span>
              </div>
              {currentLanguage === language.code && (
                <Check className="ml-auto h-4 w-4" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn(
            "gap-2",
            size === 'sm' && "h-8 px-2",
            size === 'lg' && "h-10 px-4",
            className
          )}
          disabled={isLoading}
          aria-label={t('switchLanguage')}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span className="text-lg" role="img" aria-label={`${currentLang?.name} flag`}>
                {currentLang?.flag || '🌐'}
              </span>
              {showLabel && (
                <span className="hidden sm:inline">
                  {currentLang?.nativeName || currentLanguage.toUpperCase()}
                </span>
              )}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[200px]"
        role="menu"
        aria-label={t('languageOptions')}
      >
        {enabledLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            onKeyDown={(e) => handleKeyDown(e, language.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              currentLanguage === language.code && "bg-accent"
            )}
            role="menuitem"
            aria-current={currentLanguage === language.code ? 'true' : 'false'}
          >
            <span className="text-lg" role="img" aria-label={`${language.name} flag`}>
              {language.flag}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="ml-auto h-4 w-4" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}