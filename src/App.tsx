
import './App.css';

import { Row, Col, Card, Tree, Form, Input, Button, message } from 'antd'
import React, { useEffect, useState } from 'react';
import { InputNumber } from 'antd';
import ReactECharts from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const parseKey = (key?: any): number => {
  if (!key) {
    return 1;
  }
  const fields = key.toString().split('-');
  return fields.length
}

const TreeTitle = ({ data: { title, value }, treeKey }: { data: { title: string, value: number }, treeKey: React.Key }) => {
  return (
    <>
      <div>{title} - <span>{parseKey(treeKey) === 4 ? '¥' : ''}{('' + value).includes('.') ? value.toFixed(2) : value}{parseKey(treeKey) !== 4 ? '%' : ''}</span></div>
    </>
  )
}

interface DataNode {
  title: React.ReactNode;
  data: {
    title: string;
    value: number;
    no?: string;
  },
  key: React.Key;
  isLeaf?: boolean;
  children?: DataNode[];
}

const TreeForm = ({ treeKey, data, updateTreeData }: {
  treeKey: React.Key,
  data: DataNode,
  updateTreeData: (treeKey: React.Key, data: DataNode) => any
}) => {
  const onFinish = (values: any) => {
    if (!treeKey) {
      return
    }
    if (values?.name && data) {
      updateTreeData(treeKey, {
        ...data,
        title: <TreeTitle data={{ title: values.name, value: values.value }} treeKey={data.key} />,
        data: {
          title: values.name,
          value: values.value
        }
      })
    }

  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const [form] = Form.useForm()
  useEffect(() => {
    form.setFieldsValue({ name: data.data.title, value: data.data.value || 0 })
  }, [data, form])



  const parseValue = (v?: string): string => {
    const level = parseKey(treeKey);
    if (level === 4) {
      return v ? v.replace(/¥\s?|(,*)/g, '') : '';
    } else {
      return v ? v.replace('%', '') : '';
    }
  }

  const formatValue = (v?: string): string => {
    if (parseKey(treeKey) === 4) {
      return `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return `${v}%`;
  }
  return (
    <>
      <Form
        {...layout}
        name="basic"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="name"
          name="name"
          rules={[{ required: true, message: 'Please input your name!' }]}
        >
          <Input
          />
        </Form.Item>

        <Form.Item
          label="value"
          name="value"
        >
          <InputNumber
            formatter={formatValue}
            parser={parseValue}
          />
        </Form.Item>

        <Form.Item {...tailLayout}>
          <Button type="primary" htmlType="submit">
            Save
        </Button>
        </Form.Item>
      </Form>
    </>
  )
}


const addTreeData = (list: DataNode[], key: React.Key, child: (children: DataNode[], key: React.Key) => DataNode): DataNode[] => {
  return list.map(node => {
    if (node.key === key) {
      let children: DataNode[];
      if (node.children) {
        children = [...node.children, child(node.children, key)]
      } else {
        children = [child([], key)]
      }
      return {
        ...node,
        children
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addTreeData(node.children, key, child),
      };
    }
    return node;
  });
}

const updateTreeData = (list: DataNode[], key: React.Key, child: DataNode): DataNode[] => {
  return list.map(node => {
    if (node.key === key) {
      return {
        ...node,
        ...child,
      }
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, child),
      };
    }
    return node;
  })
}

const removeTreeData = ({ parent, list, key }: { parent?: DataNode, list: DataNode[], key: React.Key }): DataNode[] => {
  const result: DataNode[] = [];
  list.forEach(node => {
    if (node.key === key) {
      return;
    }
    if (node.children) {
      node.children = removeTreeData({ parent: node, list: node.children, key })
      result.push(node);
    } else {
      result.push(node);
    }
  })

  return result.map((node, index) => {
    return {
      ...node,
      key: parent ? `${parent.key}-${index}` : `${index}`
    }
  });
}

interface SunBurstData {
  name: string;
  value: number;
  price?: number;
  level?: number;
  children?: SunBurstData[];
}

const echartOptionsData: any = {
  title: {
    subtext: '',
    text: '基金持仓分布',
    textStyle: {
      fontSize: 14,
      align: 'center'
    },
  },
  series: {
    type: 'sunburst',
    data: [],
    radius: [50, '90%'],
    nodeClick: false,
    emphasis: {
      focus: 'ancestor'
    },
    itemStyle: {
      borderRadius: 5,
      borderWidth: 2
    },
    label: {
      show: true,
      formatter: (params: any) => {
        if (('' + params.value).includes('.')) {
          return `${params.name} ${params.value?.toFixed(2)}%`
        }
        return `${params.name} ${params.value}%`
      }
    },
    levels: [{
    }, {
      r0: '0%',
      r: '30%',
      label: {
        rotate: 'radial',
      }
    }, {
      r0: '30%',
      r: '50%',
      itemStyle: {
        borderWidth: 2
      },
      label: {
        rotate: 'radial'
      }
    }, {
      r0: '50%',
      r: '70%',
      label: {
        rotate: 'radial'
      }
    }, {
      r0: '70%',
      r: '72%',
      label: {
        rotate: 'radial',
        position: 'outside',
        padding: 0
      },
      itemStyle: {
        borderWidth: 3
      }
    }]
  }
}

const convertDataNode2SunBurstData = (data: DataNode): SunBurstData => {
  return {
    name: data.data.title,
    value: data.data.value,
    level: parseKey(data.key),
    children: data.children?.map(convertDataNode2SunBurstData)
  }
}

const convertSunBurstData2DataNode = ({ key, index, data }: { key?: string, index: number, data: SunBurstData }): DataNode => {
  const titleData: { title: string, value: number } = {
    title: data.name,
    value: data.value,
  }
  key = key ? `${key}-${index}` : `${index}`
  if (parseKey(key) === 4 && data?.price) {
    titleData.value = data.price;
  }
  return {
    title: <TreeTitle data={titleData} treeKey={key} />,
    key,
    data: titleData,
    children: data?.children?.map((node, index) => convertSunBurstData2DataNode({
      key,
      index,
      data: node,
    })),
  }
}

const loadData = (): SunBurstData[] => {
  const data = localStorage.getItem('cache');
  return data ? JSON.parse(data) : [];
}

const storeData = (data: SunBurstData[]) => {
  localStorage.setItem('cache', JSON.stringify(data))
}

const getAllKeys = (nodes?: DataNode[]): DataNode[] => {
  const result: DataNode[] = [];
  nodes?.forEach(node => {
    result.push(node);
    if (node?.children) {
      getAllKeys(node?.children).forEach(node => result.push(node))
    }
  })
  return result;;
}


const App = () => {
  const [treeKey, setTreeKey] = useState<React.Key>('');
  const [selectData, setSelectData] = useState<DataNode | undefined>(void 0);
  const [sunBurstData, setSunBurstData] = useState<SunBurstData[]>([]);
  const [echartInstance, setEchartInstance] = useState<EChartsReact | null>();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const [treeData, setTreeData] = useState<Array<DataNode>>([]);

  const onSelect = (selectedKeys: React.Key[], info: any) => {
    setTreeKey(selectedKeys[0])
    setSelectData(info.selectedNodes[0]);
  };


  useEffect(() => {
    const data = loadData();
    setTreeData(_ => {
      const result = data?.map((node, index) => convertSunBurstData2DataNode({ index, data: node }))
      return result;
    })
  }, [])

  useEffect(() => {
    // convert treeData to sunBurstData
    setSunBurstData(treeData.map(convertDataNode2SunBurstData));
    setExpandedKeys(getAllKeys(treeData)?.map(node => node.key.toString()));
  }, [treeData]);

  useEffect(() => {
    echartOptionsData.series.data = sunBurstData

    // get all level 4 data
    const result: SunBurstData[] = [];
    let maxTotal = 0;
    sunBurstData.forEach(item => {
      item?.children?.forEach(item => item?.children?.forEach(item => {
        const total = item?.children?.map(item => item.value)?.reduce((p, v) => p + v);
        if (total && total / (item.value / 100) > maxTotal) {
          maxTotal = total / (item.value / 100);
        }
        item?.children?.forEach(item => result.push(item));
      }))
    })
    if (maxTotal > 0) {
      echartOptionsData.title.subtext = `期望总资产 ¥${maxTotal.toFixed(0)}`
      echartOptionsData.series.data.forEach((item: any) => {
        // level 1
        item?.children?.forEach((item: any) => {
          // level 2
          item?.children?.forEach((item: any) => {
            // level 3
            const total = item?.children?.map((data: any) => data.value)?.reduce((p: number, v: number) => p + v);
            if (total) {
              console.log(item.name, total);
              item?.children?.forEach((data: any) => {
                data.price = data.value;
                console.log(data.name, data.value, total)
                data.value = data.value * 100 / maxTotal;
              })
            }
          })
        })
      })
    }

    if (result.length) {
      console.log(result);
      const total = result.map(item => item.price).reduce((p, v) => (p || 0) + (v || 0)) || 0;
      echartOptionsData.title.subtext = `${echartOptionsData.title.subtext}，当前资产 ¥${total.toFixed(0)}，还差 ¥${(maxTotal - total).toFixed(0)}`;

    }

    echartInstance?.getEchartsInstance()?.setOption(echartOptionsData);
    storeData(sunBurstData);
  }, [sunBurstData, echartInstance]);


  const addNewTree = (e: any) => {
    if (treeKey) {
      setTreeData(v => addTreeData(
        v,
        treeKey,
        (children: DataNode[], key: React.Key) => {
          const data = {
            title: 'new Date',
            value: 0
          }
          key = `${treeKey}-${children.length}`
          return {
            title: <TreeTitle data={data} treeKey={key} />,
            data,
            key
          }
        })
      )
    } else {
      const data = {
        title: 'new Date',
        value: 0
      }
      setTreeData(old => [...old, {
        title: <TreeTitle data={data} treeKey={`${old.length}`} />,
        key: `${old.length}`,
        data: {
          title: 'new Date',
          value: 0,
        },
        children: [],
      }])
    }
  }

  const update = (treeKey: React.Key, data: DataNode) => {
    setTreeData(origin => [...updateTreeData(origin, treeKey, data)]);
  }

  const removeTree = (e: any) => {
    if (!treeKey) {
      return;
    }
    setTreeData(old => {
      return removeTreeData({ list: old, key: treeKey });
    })
  }

  return (
    <div className="App">
      <Row>
        <Col span={treeKey && selectData ? 12 : 16} className="echarts">
          <Card>
            <ReactECharts
              ref={(e) => {
                setEchartInstance(e);
              }}
              option={echartOptionsData}
              style={{ height: '800px' }}
            />
          </Card>
        </Col>
        <Col span="8">
          <Card>
            <div>
              {parseKey(treeKey) !== 4 && <Button onClick={addNewTree}>新增</Button>}
              <Button type="primary" danger onClick={removeTree}>删除</Button>
              <Button onClick={() => {
                localStorage.setItem('backup', JSON.stringify(sunBurstData))
                message.info('备份成功');
              }}>手动备份</Button>
            </div>
            <div>
              <Tree
                autoExpandParent={true}
                showLine={true}
                expandedKeys={expandedKeys}
                onSelect={onSelect}
                treeData={treeData}
              />
            </div>
          </Card>
        </Col>
        {treeKey && selectData &&
          <Col span="4">
            <Row>
              <Col>
                <Card>
                  {treeKey && selectData &&
                    <TreeForm treeKey={treeKey} data={selectData} updateTreeData={update} />}
                </Card>
              </Col>
            </Row>
            <Row>
              <Col>
                {/* <TextArea defaultValue={JSON.stringify(sunBurstData)} onChange={(e) => {
                console.log(e.target.value);
              }} /> */}
              </Col>
            </Row>

          </Col>
        }

      </Row>
    </div>
  );
}

export default App;
