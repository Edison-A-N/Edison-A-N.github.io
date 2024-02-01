---
title: nextjs-pagination
date: 2024-02-01 17:11:31
tags:
---


## 环境
```
node: v20.11.0
npm: 10.2.4
next: 14.1.0
```

## 初始化应用
```
npx create-next-app
```

## [客户端渲染](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- 客户端渲染要求自身及子组件都是客户端渲染，即都需要上声明 `'use client'`
- `state` 触发整个 DOM 重新渲染，所以使用必须是客户端渲染
- 客户端重新渲染，页面内容也要更新，所以描述页面的 DOM 也被当作客户端渲染组件，也需要声明 `'use client'`; 所以该组件不能以 [children](https://react.dev/learn/passing-props-to-a-component) 组件传入。

理解了客户端渲染的方式，就可以很容易的实现分页了。

## 实现
```ts
// app/page.tsx

import { cache } from 'react'

import { PaginatedData, Pagination } from './pagination'

export const getData = cache(() => {
  return {
    data: [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
      { id: 5, name: 'e' },
      { id: 6, name: 'f' },
    ]
  }
})


export default function Page() {
  const data = getData()

  return (
    <div>
      <Pagination data={data.data} itemsPerPage={2}
        paginationEle={PaginatedData}
      />
    </div>
  )

}
```

```ts
// app/pagination.tsx
// 由 GPT-4 自动生成

'use client'

import React, { useState } from 'react'

export function Pagination({ data, itemsPerPage, paginationEle }: {
    data: any[]
    itemsPerPage: number
    paginationEle: (data: any[]) => JSX.Element
}) {
    let [currentPage, setCurrentPage] = useState(0)

    const maxPage = Math.ceil(data.length / itemsPerPage) - 1
    const start = currentPage * itemsPerPage
    const end = start + itemsPerPage

    return (
        <>
            {paginationEle(data.slice(start, end))}
            <div className="flex justify-between my-4 space-x-4">
                <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className={`px-4 py-2 rounded shadow ${currentPage === 0 ? 'bg-gray-300' : 'bg-gray-500 hover:bg-gray-700'} text-white`}
                >
                    Previous
                </button>
                <button
                    disabled={currentPage === maxPage}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className={`px-4 py-2 rounded shadow ${currentPage === maxPage ? 'bg-gray-300' : 'bg-gray-500 hover:bg-gray-700'} text-white`}
                >
                    Next
                </button>
            </div>
        </>
    )
}

export function PaginatedData(data: any[]) {
    return (
        <div>
            {data.map((item) => (
                <div key={item.id}>{item.id}: {item.name}</div>
            ))}
        </div>
    )
}

```
