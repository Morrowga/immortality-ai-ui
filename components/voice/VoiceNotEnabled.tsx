import { motion } from "framer-motion"
import { Mic } from "lucide-react"

export function VoiceNotEnabled() {
  return (
    <div className="v-body">
      <div className="v-content">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="v-unavailable"
        >
          <div className="v-unavailable-icon"><Mic /></div>
          <h2 className="v-unavailable-title">Voice cloning coming soon</h2>
          <p className="v-unavailable-body">
            Voice training will be available once the service is activated.
            Check back later — no action needed on your end.
          </p>
        </motion.div>
      </div>
    </div>
  )
}