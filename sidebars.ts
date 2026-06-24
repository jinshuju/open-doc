import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: '金数据开放平台',
      items: ['intro'],
    },
    {
      type: 'category',
      label: 'MCP Server',
      items: [
        'mcp/index',
        'mcp/configuration',
        'mcp/use_cases',
        'mcp/oauth',
      ],
    },
    {
      type: 'category',
      label: 'API v1',
      items: [
        'api_v1',
        'api_v1/authentication',
        {
          type: 'category',
          label: '接口',
          items: [
            'api_v1/all',
            {
              type: 'category',
              label: '表单',
              items: [
                'api_v1/endpoints/get_forms',
                'api_v1/endpoints/get_form',
                'api_v1/endpoints/create_form',
                'api_v1/endpoints/update_form',
                'api_v1/endpoints/copy_form',
                'api_v1/endpoints/update_form_theme',
                'api_v1/endpoints/update_form_folder',
                {
                  type: 'category',
                  label: '视图',
                  items: [
                    'api_v1/endpoints/get_form_views',
                    'api_v1/endpoints/get_form_view',
                    'api_v1/endpoints/create_form_view',
                    'api_v1/endpoints/update_form_view',
                    'api_v1/endpoints/delete_form_view',
                    'api_v1/endpoints/get_form_view_entries',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: '文件夹',
              items: [
                'api_v1/endpoints/get_folders',
                'api_v1/endpoints/create_folder',
              ],
            },
            {
              type: 'category',
              label: '数据',
              items: [
                'api_v1/endpoints/get_form_entries',
                'api_v1/endpoints/create_form_entry',
                'api_v1/endpoints/create_form_entries',
                'api_v1/endpoints/create_entry_attachment',
                'api_v1/endpoints/get_form_entry',
                'api_v1/endpoints/update_form_entry',
                'api_v1/endpoints/delete_form_entry',
              ],
            },
            {
              type: 'category',
              label: '账户',
              items: [
                'api_v1/endpoints/get_me',
                'api_v1/endpoints/get_billing_account',
                'api_v1/endpoints/get_billing_account_users',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Schema',
          items: [
            'api_v1/schemas/field',
            'api_v1/schemas/form_setting',
            'api_v1/schemas/entry',
            'api_v1/schemas/entry_post',
          ],
        },
        'api_v1/status_code',
        'api_v1/request_rate',
      ],
    },
    {
      type: 'category',
      label: 'Webhook',
      items: [
        'webhook/home',
        'webhook/configuration',
        'webhook/data_format',
        'webhook/how_to_try_webhook',
        'webhook/outbound_ip_list',
      ],
    },
    {
      type: 'category',
      label: 'URL 传参',
      items: [
        'url_params/overview',
        'url_params/x_field',
        'url_params/form_field_url_params',
        'url_params/global_field_url_params',
      ],
    },
    {
      type: 'category',
      label: '表单嵌入',
      items: ['embedded/overview'],
    },
    {
      type: 'category',
      label: '重命名 API_CODE',
      items: ['api_code_alias/overview'],
    },
    {
      type: 'category',
      label: '其他',
      items: [
        'best_practice',
      ],
    },
  ],
};

export default sidebars;
