import { memo } from 'react';
import { useTranslation } from 'react-i18next';

type [ComponentName]Props = {
  // callback props — never pass setState down
  onChange: (value: [ValueType]) => void;
};

const [ComponentName] = memo(({ onChange }: [ComponentName]Props) => {
  const { t } = useTranslation();

  const render[Section] = () => {
    // early return pattern
    return null;
  };

  return (
    <div>
      {render[Section]()}
    </div>
  );
});

[ComponentName].displayName = '[ComponentName]';
export default [ComponentName];
