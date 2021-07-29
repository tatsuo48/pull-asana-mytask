'use babel';

import PullAsanaMytaskMessageDialog from './pull-asana-mytask-message-dialog';

module.exports = {

  activate() {
    inkdrop.components.registerClass(PullAsanaMytaskMessageDialog);
    inkdrop.layouts.addComponentToLayout(
      'modal',
      'PullAsanaMytaskMessageDialog'
    )
  },

  deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
      'modal',
      'PullAsanaMytaskMessageDialog'
    )
    inkdrop.components.deleteClass(PullAsanaMytaskMessageDialog);
  }

};
