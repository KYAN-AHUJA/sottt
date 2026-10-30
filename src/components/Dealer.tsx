import type { DealerPose } from '../animations/animationManager'

export function Dealer({ pose, restrained }: { pose: DealerPose; restrained: boolean }) {
  return (
    <div className={`dealer pose-${pose} ${restrained ? 'is-restrained' : ''}`}>
      <div className="dealer-shoulders" />
      <div className="dealer-coat" />
      <div className="dealer-head">
        <div className="dealer-hood" />
        <div className="dealer-face">
          <span className="eye left" />
          <span className="eye right" />
          <span className="mouth" />
        </div>
      </div>
      <div className="dealer-hands">
        <span className="hand left" />
        <span className="hand right" />
      </div>
    </div>
  )
}
