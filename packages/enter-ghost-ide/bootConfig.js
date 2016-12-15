const Path = require('path');



const menu = [
    {
       submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
          },
          {
            label: 'Find in files',
            accelerator: 'CmdOrCtrl+Shift+F',
          },
         {role: 'quit'}
       ]
    },
    {
      	label: 'File',
		submenu: [
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
          },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
          },
          {
            label: 'Close document',
            accelerator: 'CmdOrCtrl+W',
          },
          {
            label: 'Find file',
            accelerator: 'CmdOrCtrl+P',
          },

        ]
    },
    {
        label: 'Edit',
        submenu: [
          {
            role: 'undo'
          },
          {
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            role: 'cut'
          },
          {
            role: 'copy'
          },
          {
            role: 'paste'
          },
          {
            role: 'pasteandmatchstyle'
          },
          {
            role: 'delete'
          },
          {
            role: 'selectall'
          }
      ]

    },
    {
      	label: 'Refactor',
		submenu: [
            {
                label: 'Extract',
            },
            {
                label: 'Extract sss dd ',
            }

        ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Drawer',
          accelerator: 'CmdOrCtrl+.',
        }
      ]
    }
];


module.exports = {
    url:  'file://' + Path.join(__dirname, 'src/index.html'),
    openDevTools: true,
    menu,
};
