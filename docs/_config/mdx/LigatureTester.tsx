import { type FC, useId } from 'react';

type LigatureTesterProps = {
  defaultValue?: string;
};

const LigatureTester: FC<LigatureTesterProps> = props => {
  const { defaultValue = ':i: :love: :straylight:' } = props;
  const fieldId = useId();

  return (
    <div className="component-shell">
      <div className="tester" data-alev-tester="">
        <label className="tester-label" htmlFor={fieldId}>
          Input
        </label>
        <textarea
          id={fieldId}
          className="tester-input"
          spellCheck={false}
          defaultValue={defaultValue}
          data-alev-input=""
        />
        <div className="tester-preview-wrap">
          <div className="tester-caption">Preview</div>
          <div className="tester-preview" data-alev-preview="">
            {defaultValue}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LigatureTester;
