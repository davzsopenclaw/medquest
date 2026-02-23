// Demo page — redirects to quiz with a sample question (no auth required)
import { redirect } from 'next/navigation'
export default function DemoPage() {
  redirect('/quiz?mode=demo')
}
