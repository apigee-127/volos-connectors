module.exports = {
  'employees': {
    queryStringBasic: 'SELECT id_emp, emp_name FROM public.employees',
    queryStringExpanded: 'SELECT * FROM public.employees',
    idName: 'id_emp',
    queryParameters: {
      role: 'id_role = \'{role}\'',
      foobar: 'id_role = \'{role}\'',
      lower_id: 'id_emp = lower(\'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
  },
  'roles': {
    queryStringBasic: 'SELECT id_role, role_name FROM public.roles',
    queryStringExpanded: 'SELECT * FROM public.roles',
    idName: 'id_role',
    queryParameters: {
      pay_grade: 'pay_grade=\'{pay_grade}\''
    }
  },
  'emp_roles': {
    queryStringBasic: 'SELECT e.id_emp, e.emp_name, r.pay_grade FROM public.employees e LEFT OUTER JOIN public.roles r ON e.id_role = r.id_role',
    queryStringExpanded: 'SELECT e.*, r.* FROM public.employees e LEFT OUTER JOIN public.roles r ON e.id_role = r.id_role',
    idName: 'e.id_emp',
    queryParameters: {
      role: 'id_role = \'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
  },
  'informationColumns': {
    queryStringBasic: 'SELECT column_name, data_type, table_schema, table_name FROM INFORMATION_SCHEMA.COLUMNS',
    queryStringExpanded: 'SELECT * FROM INFORMATION_SCHEMA.COLUMNS',
    idName: 'column_name',
    queryParameters: {
      table_name: 'table_name = \'{table_name}\'',
      table_catalog: 'table_catalog = \'(table_catalog}\'',
      table_schema: 'table_schema = \'{table_schema}\''
    }
  },
  'information': {
    queryStringBasic: 'SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_type = \'BASE TABLE\'',
    queryStringExpanded: 'SELECT * FROM INFORMATION_SCHEMA.TABLES',
    idName: 'table_name',
    queryParameters: {
      table_name: 'table_name = \'{table_name}\'',
      table_catalog: 'table_catalog = \'(table_catalog}\'',
      table_schema: 'table_schema = \'{table_schema}\'',
      table_type: 'table_type = \'{table_type}\''
    }
  }
};