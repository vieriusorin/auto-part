type IntegrityBadgeProps = {
  verified: boolean
}

const IntegrityBadge = ({ verified }: IntegrityBadgeProps) => {
  return <span>{verified ? 'Verified' : 'Verification failed'}</span>
}

export default IntegrityBadge
