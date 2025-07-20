'use client'

import { useCallback, useState } from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { Avatar, Flex, Heading, IconButton, Select, Tooltip } from '@radix-ui/themes'
import cs from 'classnames'
import NextLink from 'next/link'
import { FaAdjust, FaGithub, FaMoon, FaRegSun } from 'react-icons/fa'
import { Link } from '../Link'
import { useTheme } from '../Themes'
import { ConnectButton } from './ConnectButton'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  console.log('theme', theme)
  const [, setShow] = useState(false)

  const toggleNavBar = useCallback(() => {
    setShow((state) => !state)
  }, [])

  return (
    <header
      className="self-stretch px-10 py-2.5 inline-flex justify-between items-center sticky top-0 z-50"
      style={{
        backgroundColor: '#27272a',
        borderBottom: '1px solid #3f3f46',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        minHeight: '46px'
      }}
    >
      {/* 左侧 Logo 和标题 */}
      <div className="flex justify-start items-center gap-1.5">
        <div className="w-5 h-5 relative overflow-hidden">
          <img 
            src="/favicon.png" 
            alt="Miraix AI Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <NextLink href="/">
          <div className="justify-start text-white/90 text-xl font-normal font-['Anonymous_Pro'] cursor-pointer hover:opacity-80 transition-opacity">
            Miraix AI
          </div>
        </NextLink>
      </div>

      {/* 右侧按钮区域 - 调整按钮尺寸 */}
      <div className="flex items-center gap-2.5">
          <ConnectButton />
        {/* <Tooltip content="Navigation">
          <IconButton
            size="3"
            variant="ghost"
            color="gray"
            className="md:hidden"
            onClick={toggleNavBar}
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              width: '23px',
              height: '23px'
            }}
          >
            <HamburgerMenuIcon width="14" height="14" />
          </IconButton>
        </Tooltip> */}
      </div>
    </header>
  )
}
