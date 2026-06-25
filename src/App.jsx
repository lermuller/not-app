import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewFeed from './pages/NewFeed'
import FeedView from './pages/FeedView'
import SuggestionFeed from './pages/SuggestionFeed'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewFeed />} />
        <Route path="/suggestion" element={<SuggestionFeed />} />
        <Route path="/feed/:id" element={<FeedView />} />
      </Routes>
    </BrowserRouter>
  )
}
